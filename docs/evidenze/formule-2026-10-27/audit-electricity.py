#!/usr/bin/env python3
"""Descriptive audit of official Portale Offerte ML electricity XML. No cost estimate.

Codes: AU Trasmissione Offerte Mercato Retail v5.0, pp52-63.
Categories overlap. Date filter intersects calendar day; it is not final eligibility.
"""
import argparse, collections, csv, datetime, decimal, hashlib, json, pathlib, xml.etree.ElementTree as ET

def text(e, path, default=None):
    return e.findtext(path, default)

def descendants(e, tag):
    return list(e.iter(tag))

def values(e, path):
    return [n.text for n in e.findall(path)]

def inspect_offer(o, day):
    code = text(o, 'IdentificativiOfferta/COD_OFFERTA')
    activation = sorted(set(values(o, 'DettaglioOfferta/TIPOLOGIA_ATT_CONTR')))
    start = text(o, 'ValiditaOfferta/DATA_INIZIO')
    end = text(o, 'ValiditaOfferta/DATA_FINE')
    start_day = datetime.datetime.strptime(start, '%d/%m/%Y_%H:%M:%S').date()
    end_day = datetime.datetime.strptime(end, '%d/%m/%Y_%H:%M:%S').date()
    single = text(o, 'DettaglioOfferta/OFFERTA_SINGOLA') == 'SI'
    switching = bool(set(activation) & {'01','99'})
    valid = start_day <= day <= end_day
    components = o.findall('ComponenteImpresa')
    intervals = o.findall('ComponenteImpresa/IntervalloPrezzi')
    standard_intervals = [x for c in components if text(c,'TIPOLOGIA') == '01' for x in c.findall('IntervalloPrezzi')]
    discounts = o.findall('Sconto')
    refs = o.findall('RiferimentiPrezzoEnergia')
    kind = text(o, 'DettaglioOfferta/TIPO_OFFERTA')
    bands = text(o, 'TipoPrezzo/TIPOLOGIA_FASCE')
    def present(nodes, tags):
        return any(any(n.find(t) is not None for t in tags) for n in nodes)
    differentiated = False
    standard_period_change = False
    standard_tier_change = False
    for c in components:
        by_context = collections.defaultdict(set)
        for i in c.findall('IntervalloPrezzi'):
            if text(i,'FASCIA_COMPONENTE') is not None:
                ctx = (text(i,'CONSUMO_DA'),text(i,'CONSUMO_A'),ET.tostring(i.find('PeriodoValidita')) if i.find('PeriodoValidita') is not None else None)
                by_context[ctx].add(decimal.Decimal(text(i,'PREZZO')))
        differentiated |= any(len(v)>1 for v in by_context.values())
        if text(c,'TIPOLOGIA') == '01':
            period_groups = collections.defaultdict(list)
            tier_groups = collections.defaultdict(list)
            for i in c.findall('IntervalloPrezzi'):
                period_groups[(text(i,'FASCIA_COMPONENTE'),text(i,'CONSUMO_DA'),text(i,'CONSUMO_A'))].append(i)
                tier_groups[(text(i,'FASCIA_COMPONENTE'),ET.tostring(i.find('PeriodoValidita')) if i.find('PeriodoValidita') is not None else None)].append(i)
            standard_period_change |= any(any(i.find('PeriodoValidita') is not None for i in group) and len(set(decimal.Decimal(text(i,'PREZZO')) for i in group))>1 for group in period_groups.values())
            standard_tier_change |= any(any(i.find('CONSUMO_DA') is not None or i.find('CONSUMO_A') is not None for i in group) and len(set(decimal.Decimal(text(i,'PREZZO')) for i in group))>1 for group in tier_groups.values())
    flags = {
        'fixed':kind=='01', 'variable':kind=='02', 'flat':kind=='03', 'mixed':kind=='04',
        'all_inclusive':text(o,'DettaglioOfferta/OFFERTA_ONNICOMPRENSIVA')=='01',
        'all_inclusive_canone':text(o,'DettaglioOfferta/OFFERTA_ONNICOMPRENSIVA')=='02',
        'time_bands':bands not in (None,'01'), 'three_bands':bands=='03', 'two_bands':bands in ('91','92','93'),
        'peak_offpeak':bands=='07', 'custom_band_schedule':any('FasceOrarie' in e.tag for e in o.iter()),
        'different_prices_across_bands':differentiated,
        'discount_any':bool(discounts),
        'discount_unconditional':any(text(s,'Condizione/CONDIZIONE_APPLICAZIONE')=='00' for s in discounts),
        'discount_unconditional_firstyear':any(text(s,'Condizione/CONDIZIONE_APPLICAZIONE')=='00' and text(s,'VALIDITA') in ('01','02') for s in discounts),
        'discount_conditional':any(text(s,'Condizione/CONDIZIONE_APPLICAZIONE') not in (None,'00') for s in discounts),
        'discount_percent':any(text(p,'UNITA_MISURA')=='06' for s in discounts for p in s.findall('PrezziSconto')),
        'discount_absolute_euro':any(text(p,'UNITA_MISURA')=='05' for s in discounts for p in s.findall('PrezziSconto')),
        'discount_fixed_annual':any(text(p,'UNITA_MISURA')=='01' for s in discounts for p in s.findall('PrezziSconto')),
        'discount_per_kwh':any(text(p,'UNITA_MISURA')=='03' for s in discounts for p in s.findall('PrezziSconto')),
        'discount_power':any(text(p,'TIPOLOGIA')=='02' for s in discounts for p in s.findall('PrezziSconto')),
        'discount_tutela':any(text(p,'TIPOLOGIA')=='04' for s in discounts for p in s.findall('PrezziSconto')),
        'discount_band':any(s.find('CODICE_COMPONENTE_FASCIA') is not None for s in discounts),
        'discount_period':any(s.find('PeriodoValidita') is not None for s in discounts),
        'discount_consumption_tiers':any(p.find('VALIDO_DA') is not None or p.find('VALIDO_FINO') is not None for s in discounts for p in s.findall('PrezziSconto')),
        'price_period':present(intervals,['PeriodoValidita']),
        'standard_price_period':present(standard_intervals,['PeriodoValidita']),
        'standard_price_changes_by_period':standard_period_change,
        'price_consumption_tiers':present(intervals,['CONSUMO_DA','CONSUMO_A']),
        'standard_price_consumption_tiers':present(standard_intervals,['CONSUMO_DA','CONSUMO_A']),
        'standard_price_changes_by_consumption_tiers':standard_tier_change,
        'index_coefficient':any(r.find('COEFFICIENTE') is not None for r in refs),
        'index_coefficient_not_one':any(decimal.Decimal(text(r,'COEFFICIENTE','1')) != 1 for r in refs),
        'multiple_index_references':len(refs)>1,
        'per_band_index_references':any(r.find('FASCIA_PREZZO') is not None for r in refs),
        'optional_component':any(text(c,'TIPOLOGIA')=='02' for c in components),
        'standard_renewable_energy_component':any(text(c,'TIPOLOGIA')=='01' and text(c,'MACROAREA')=='06' for c in components),
        'power_priced_component':any(text(i,'UNITA_MISURA')=='02' for i in intervals),
        'one_off_priced_component':any(text(i,'UNITA_MISURA')=='05' for i in intervals),
        'fixed_with_index_reference':kind=='01' and bool(refs),
        'regulated_components':bool(o.findall('ComponentiRegolate/CODICE')),
        'custom_dispatch':any(text(d,'TIPO_DISPACCIAMENTO')=='99' for d in o.findall('Dispacciamento')),
        'limiting_contract_condition':any(text(c,'LIMITANTE')=='01' for c in o.findall('CondizioniContrattuali')),
        'geographic_scope':bool(o.findall('ZoneOfferta/REGIONE')+o.findall('ZoneOfferta/PROVINCIA')+o.findall('ZoneOfferta/COMUNE')),
        'consumption_limits':present(o.findall('CaratteristicheOfferta'),['CONSUMO_MIN','CONSUMO_MAX']),
        'power_limits':present(o.findall('CaratteristicheOfferta'),['POTENZA_MIN','POTENZA_MAX']),
        'additional_products':bool(o.findall('ProdottiServiziAggiuntivi')),
    }
    return {'code':code,'supplier_vat':text(o,'IdentificativiOfferta/PIVA_UTENTE'),'name':text(o,'DettaglioOfferta/NOME_OFFERTA'),
            'single':single,'activation_codes':activation,'switching':switching,'valid_on_day':valid,'start':start,'end':end,
            'in_scope':single and switching and valid,'offer_type':kind,'band_type':bands,'index_codes':values(o,'RiferimentiPrezzoEnergia/IDX_PREZZO_ENERGIA'),'flags':flags}

def summary(rows):
    keys=rows[0]['flags'].keys() if rows else []
    return {'offers':len(rows),'suppliers':len(set(r['supplier_vat'] for r in rows)),
        'offer_types':dict(collections.Counter(r['offer_type'] for r in rows)),
        'band_types':dict(collections.Counter(r['band_type'] for r in rows)),
        'index_codes':dict(collections.Counter(k for r in rows for k in set(r['index_codes']))),
        'flags':{k:{'offers':sum(r['flags'][k] for r in rows),'suppliers':len(set(r['supplier_vat'] for r in rows if r['flags'][k])),'example_codes':[r['code'] for r in rows if r['flags'][k]][:5]} for k in keys}}

def main():
    p=argparse.ArgumentParser();p.add_argument('xml');p.add_argument('--date',required=True);p.add_argument('--out',required=True);p.add_argument('--csv')
    args=p.parse_args(); day=datetime.date.fromisoformat(args.date)
    path=pathlib.Path(args.xml); root=ET.parse(path).getroot()
    for e in root.iter(): e.tag=e.tag.split('}')[-1]
    counts=collections.Counter(text(o,'IdentificativiOfferta/COD_OFFERTA') for o in root)
    if any(v>1 for v in counts.values()):raise ValueError('Duplicate codes need explicit reconciliation')
    domestic=[o for o in root if text(o,'DettaglioOfferta/TIPO_CLIENTE')=='01']
    rows=[inspect_offer(o,day) for o in domestic]
    selections={'domestic':rows,'domestic_single':[r for r in rows if r['single']],
                'domestic_single_switching':[r for r in rows if r['single'] and r['switching']],
                'scope':[r for r in rows if r['in_scope']]}
    result={'source':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'date':args.date,'total_records':len(root),'unique_codes':len(counts)},
            'method':'Domestic01, singleSI, any activation01 or99, date intersects publication day. Per-profile eligibility not checked. Categories overlap.',
            'summaries':{k:summary(v) for k,v in selections.items()},'offers':rows}
    pathlib.Path(args.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    if args.csv:
        csvrows=[{**{k:('|'.join(v) if isinstance(v,list) else v) for k,v in r.items() if k!='flags'}, **r['flags']} for r in rows]
        with pathlib.Path(args.csv).open('w',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=list(csvrows[0]));writer.writeheader();writer.writerows(csvrows)
    print(json.dumps({'source':result['source'],'funnel':{k:v['offers'] for k,v in result['summaries'].items()},'scope':result['summaries']['scope']},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
