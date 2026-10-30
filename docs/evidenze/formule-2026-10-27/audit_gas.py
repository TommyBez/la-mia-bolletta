#!/usr/bin/env python3
"""Reproducible descriptive gas offer audit, NOT a bill calculator.
Only Python standard library. Source enum semantics: AU Trasmissione v5.0,
pp52-62; calculation rules v4.2 pp37-42. Counts are unique offer codes.
"""
import argparse,collections,csv,datetime,hashlib,json,pathlib,xml.etree.ElementTree as ET
from decimal import Decimal

def t(e,p,d=''): return e.findtext(p,default=d) or d

def compact(e):
 d={}
 for c in e:
  v=compact(c) if len(c) else (c.text or '').strip()
  if c.tag in d:
   if not isinstance(d[c.tag],list):d[c.tag]=[d[c.tag]]
   d[c.tag].append(v)
  else:d[c.tag]=v
 return d

def audit(path,asof):
 b=pathlib.Path(path).read_bytes();root=ET.fromstring(b)
 for e in root.iter():e.tag=e.tag.split('}')[-1]
 out=[]
 for o in root:
  code=t(o,'IdentificativiOfferta/COD_OFFERTA');supplier=t(o,'IdentificativiOfferta/PIVA_UTENTE')
  typ=t(o,'DettaglioOfferta/TIPO_OFFERTA');dom=t(o,'DettaglioOfferta/TIPO_CLIENTE')=='01';single=t(o,'DettaglioOfferta/OFFERTA_SINGOLA')=='SI'
  activation=sorted({e.text for e in o.findall('DettaglioOfferta/TIPOLOGIA_ATT_CONTR')});switch=bool({'01','99'}&set(activation))
  start=datetime.datetime.strptime(t(o,'ValiditaOfferta/DATA_INIZIO'),'%d/%m/%Y_%H:%M:%S');end=datetime.datetime.strptime(t(o,'ValiditaOfferta/DATA_FINE'),'%d/%m/%Y_%H:%M:%S')
  active=start.date()<=asof.date()<=end.date()
  components=o.findall('ComponenteImpresa');intervals=o.findall('ComponenteImpresa/IntervalloPrezzi');discounts=o.findall('Sconto');refs=o.findall('RiferimentiPrezzoEnergia')
  discount_prices=[v for s in discounts for v in s.findall('PrezziSconto')]
  relevant=[s for s in discounts if t(s,'VALIDITA')in('01','02') and t(s,'Condizione/CONDIZIONE_APPLICAZIONE')=='00']
  relevant_prices=[v for s in relevant for v in s.findall('PrezziSconto')]
  standard_intervals=[v for c in components if t(c,'TIPOLOGIA')=='01' for v in c.findall('IntervalloPrezzi')]
  flags={
   'fixed':typ=='01','variable':typ=='02','flat':typ=='03','mixed':typ=='04',
   'all_inclusive':t(o,'DettaglioOfferta/OFFERTA_ONNICOMPRENSIVA')=='01',
   'canone':t(o,'DettaglioOfferta/OFFERTA_ONNICOMPRENSIVA')=='02' or o.find('DettaglioOfferta/CONSUMO_CANONE')is not None,
   'commercial_tiers_standard':any(i.find('CONSUMO_DA')is not None or i.find('CONSUMO_A')is not None for i in standard_intervals),
   'price_period_standard':any(i.find('PeriodoValidita')is not None for i in standard_intervals),
   'commercial_tiers':any(i.find('CONSUMO_DA')is not None or i.find('CONSUMO_A')is not None for i in intervals),
   'price_period':any(i.find('PeriodoValidita')is not None for i in intervals),
   'price_period_different_from_default':any(c.find('IntervalloPrezzi/PeriodoValidita') is not None and len({Decimal(t(v,'PREZZO')) for v in c.findall('IntervalloPrezzi')})>1 for c in components),
   'commercial_tiers_different_prices':any((c.find('IntervalloPrezzi/CONSUMO_DA')is not None or c.find('IntervalloPrezzi/CONSUMO_A')is not None) and len({Decimal(t(v,'PREZZO'))for v in c.findall('IntervalloPrezzi')})>1 for c in components),
   'price_period_under_12':any(i.find('PeriodoValidita/DURATA')is not None and Decimal(t(i,'PeriodoValidita/DURATA'))<12 for i in intervals),
   'discount_any':bool(discounts),
   'discount_nonzero':any(Decimal(t(v,'PREZZO'))!=0 for v in discount_prices),
   'discount_unconditional_firstyear_nonzero':any(Decimal(t(v,'PREZZO'))!=0 for v in relevant_prices),
   'discount_conditioned':any(t(s,'Condizione/CONDIZIONE_APPLICAZIONE')!='00'for s in discounts),
   'discount_unconditional_firstyear':bool(relevant),
   'discount_firstyear_fixed':any(t(v,'TIPOLOGIA')=='01'for v in relevant_prices),
   'discount_firstyear_sales':any(t(v,'TIPOLOGIA')=='03'for v in relevant_prices),
   'discount_firstyear_tutela':any(t(v,'TIPOLOGIA')=='04'for v in relevant_prices),
   'discount_percent_any':any(t(v,'UNITA_MISURA')=='06'for v in discount_prices),
   'discount_percent_firstyear':any(t(v,'UNITA_MISURA')=='06'for v in relevant_prices),
   'discount_period':any(s.find('PeriodoValidita')is not None for s in discounts),
   'discount_period_firstyear':any(s.find('PeriodoValidita')is not None for s in relevant),
   'discount_tier':any(v.find('VALIDO_DA')is not None or v.find('VALIDO_FINO')is not None for v in discount_prices),
   'multiple_indices':len(refs)>1,
   'fixed_with_index':typ=='01' and bool(refs),
   'index_coefficient_nonunit':any(r.find('COEFFICIENTE')is not None and Decimal(t(r,'COEFFICIENTE'))!=1 for r in refs),
   'one_off_component':any(t(c,'MACROAREA')=='05'for c in components),
   'optional_component':any(t(c,'TIPOLOGIA')=='02'for c in components),
   'regulated_sales_components':bool(o.findall('ComponentiRegolate/CODICE')),
   'explicit_geography':any(len(z)>0 for z in o.findall('ZoneOfferta')),
   'restrictive_contract_terms':any(t(c,'LIMITANTE')=='01'for c in o.findall('CondizioniContrattuali')),
   'non_default_price_type':any(i.find('TIPO_PREZZO')is not None for i in intervals),
  }
  out.append({'code':code,'supplier_vat':supplier,'name':t(o,'DettaglioOfferta/NOME_OFFERTA'),'contract_duration_months':t(o,'DettaglioOfferta/DURATA'),'payment_codes':sorted({v.text for v in o.findall('MetodoPagamento/MODALITA_PAGAMENTO')}),'domestic':dom,'single':single,'activation_codes':activation,'switching':switch,'valid_at_analysis':active,'valid_from':start.isoformat(),'valid_to':end.isoformat(),'in_scope':dom and single and switch and active,'offer_type':typ,'indices':[compact(r)for r in refs],'flags':flags,'components':[compact(c)for c in components],'discounts':[compact(s)for s in discounts],'regulated_codes':sorted({e.text for e in o.findall('ComponentiRegolate/CODICE')}),'terms':[compact(c)for c in o.findall('CondizioniContrattuali')],'geography':[compact(z)for z in o.findall('ZoneOfferta')],'consumption_bounds':compact(o.find('CaratteristicheOfferta')) if o.find('CaratteristicheOfferta')is not None else {},'offer_url':t(o,'DettaglioOfferta/Contatti/URL_OFFERTA')})
 codes=collections.Counter(x['code']for x in out)
 if any(n>1 for n in codes.values()):raise ValueError('Duplicate offer codes; resolve before count')
 def stats(arr):
  return {'offers':len(arr),'suppliers':len({r['supplier_vat']for r in arr}),'types':dict(collections.Counter(r['offer_type']for r in arr)),'index_combinations':dict(collections.Counter('|'.join(sorted(i['IDX_PREZZO_ENERGIA']for i in r['indices'])) or 'none' for r in arr)),'flags':{f:{'offers':len([r for r in arr if r['flags'][f]]),'suppliers':len({r['supplier_vat']for r in arr if r['flags'][f]}),'codes':[r['code']for r in arr if r['flags'][f]]}for f in out[0]['flags']}}
 scopes={'all':out,'domestic':[r for r in out if r['domestic']],'domestic_single':[r for r in out if r['domestic']and r['single']],'domestic_single_switch':[r for r in out if r['domestic']and r['single']and r['switching']],'in_scope':[r for r in out if r['in_scope']]}
 return {'source':str(path),'sha256':hashlib.sha256(b).hexdigest(),'valid_on_date_italy':asof.date().isoformat(),'scope_note':'Domestic, single-supply, switching allowed, offer-validity window intersects the calendar date. NOT user-specific eligibility: geography, consumption and contract restrictions still apply. Flags overlap.','stats':{k:stats(v)for k,v in scopes.items()},'offers':out}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('xml');ap.add_argument('--date','--as-of',dest='as_of',default='2026-10-27');ap.add_argument('--output',default='/tmp/audit-gas.json');a=ap.parse_args()
 result=audit(a.xml,datetime.datetime.fromisoformat(a.as_of));p=pathlib.Path(a.output);p.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
 csvpath=p.with_suffix('.csv')
 with csvpath.open('w')as f:
  flags=list(result['offers'][0]['flags']);w=csv.DictWriter(f,fieldnames=['code','supplier_vat','name','domestic','single','switching','valid_at_analysis','in_scope','offer_type']+flags);w.writeheader()
  for r in result['offers']:w.writerow({**{k:r[k]for k in w.fieldnames if k in r},**r['flags']})
 print(json.dumps({k:{'offers':v['offers'],'suppliers':v['suppliers'],'types':v['types']}for k,v in result['stats'].items()},ensure_ascii=False))
 print(json.dumps({f:{k:v for k,v in counts.items()if k!='codes'}for f,counts in result['stats']['in_scope']['flags'].items()},ensure_ascii=False))
 print(p,csvpath)
