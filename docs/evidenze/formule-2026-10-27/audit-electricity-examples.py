#!/usr/bin/env python3
"""Selected real-record arithmetic for design audit; NOT a bill comparison engine."""
import argparse, decimal, hashlib, json, pathlib, xml.etree.ElementTree as ET
D=decimal.Decimal

def details(o):
    return {
        'name':o.findtext('DettaglioOfferta/NOME_OFFERTA'),
        'code':o.findtext('IdentificativiOfferta/COD_OFFERTA'),
        'supplier_url':o.findtext('DettaglioOfferta/Contatti/URL_OFFERTA'),
        'price_components':[{'name':c.findtext('NOME'),'macroarea':c.findtext('MACROAREA'),'type':c.findtext('TIPOLOGIA'),
          'intervals':[{e.tag:e.text for e in i if len(e)==0} for i in c.findall('IntervalloPrezzi')]} for c in o.findall('ComponenteImpresa')],
        'discounts':[{'name':s.findtext('NOME'),'validity':s.findtext('VALIDITA'),'condition':s.findtext('Condizione/CONDIZIONE_APPLICAZIONE'),
           'description':s.findtext('DESCRIZIONE'),'prices':[{e.tag:e.text for e in p} for p in s.findall('PrezziSconto')]} for s in o.findall('Sconto')],
        'dispatch_codes':[e.text for e in o.findall('Dispacciamento/TIPO_DISPACCIAMENTO')],
        'guarantees':o.findtext('DettaglioOfferta/GARANZIE'),
    }

def simple_quotes(o):
    assert o.findtext('DettaglioOfferta/TIPO_OFFERTA')=='01'
    assert o.findtext('TipoPrezzo/TIPOLOGIA_FASCE')=='01'
    assert o.findtext('DettaglioOfferta/OFFERTA_SINGOLA')=='SI'
    assert [e.text for e in o.findall('Dispacciamento/TIPO_DISPACCIAMENTO')]==['14']
    assert not o.findall('ComponentiRegolate/CODICE')
    assert o.find('DettaglioOfferta/OFFERTA_ONNICOMPRENSIVA') is None
    assert not any(e.tag in ('REGIONE','PROVINCIA','COMUNE') for z in o.findall('ZoneOfferta') for e in z)
    q={}
    for c in o.findall('ComponenteImpresa'):
        assert c.findtext('TIPOLOGIA')=='01'
        a=c.findall('IntervalloPrezzi');assert len(a)==1
        i=a[0];assert all(i.find(k) is None for k in ('CONSUMO_DA','CONSUMO_A','PeriodoValidita'))
        key=i.findtext('UNITA_MISURA');assert key not in q and key in ('01','03')
        q[key]=D(i.findtext('PREZZO'))
    assert set(q)=={'01','03'}
    return q

def main():
    p=argparse.ArgumentParser();p.add_argument('xml');p.add_argument('--out',required=True);a=p.parse_args()
    path=pathlib.Path(a.xml);r=ET.parse(path).getroot()
    for e in r.iter():e.tag=e.tag.split('}')[-1]
    bycode={o.findtext('IdentificativiOfferta/COD_OFFERTA'):o for o in r}
    plen=bycode['026160ESFML56XXLFIXA24VSMA151026'];iren=bycode['000208ESFML02XX000IEDOLCFX261027']
    qp=simple_quotes(plen);qi=simple_quotes(iren)
    def selected_discount(o,unit):
        result=[]
        for s in o.findall('Sconto'):
            if s.findtext('Condizione/CONDIZIONE_APPLICAZIONE')=='00' and s.findtext('VALIDITA') in ('01','02'):
                for p in s.findall('PrezziSconto'):
                    assert p.findtext('UNITA_MISURA')==unit
                    result.append(D(p.findtext('PREZZO')))
        assert len(result)==1
        return result[0]
    pc=selected_discount(plen,'06');ic=selected_discount(iren,'01');q=D('2700')
    pb=qp['01']+qp['03']*q;ib=qi['01']+qi['03']*q;pd=qp['03']*q*pc/100
    tier=bycode['000208ESFML02XX00IEDOPRIMN261027']
    ti=[i for c in tier.findall('ComponenteImpresa') if c.findtext('MACROAREA')=='04' for i in c.findall('IntervalloPrezzi') if i.find('CONSUMO_DA') is not None]
    assert len(ti)==2 and ti[0].findtext('CONSUMO_A')=='3000'
    p1=D(ti[0].findtext('PREZZO'));p2=D(ti[1].findtext('PREZZO'))
    tq=D('4500');real=D('3000')*p1+(tq-D('3000'))*p2
    result={'source':{'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},
      'limitations':'Selected vendor-charge arithmetic, not total annual expenditure or market ranking. No recommendation, no proof of cheapest offer. Eligibility per real user and full fiscal/network charges not simulated.',
      'percentage_discount':{'assumed_kwh':str(q),'plenitude':details(plen),'iren':details(iren),'plenitude_before_discount':str(pb),
       'plenitude_discount':str(pd),'plenitude_after_unconditional_discount':str(pb-pd),'iren_before_discount':str(ib),'iren_discount':str(ic),
       'iren_after_unconditional_discount':str(ib-ic),'plenitude_minus_iren_before_discounts':str(pb-ib),'plenitude_minus_iren_after_unconditional_discounts':str(pb-pd-ib+ic),
       'assumptions':'Only unconditional discounts within first12months. Plenitude conditional5% excluded; its stacking not assumed. Same domestic supply profile, both monoraria, CdispD14, no separate regulated components, no optional items. Prices in export already include network losses. All other bill charges and taxes excluded from this subtotal.'},
      'consumption_tiers':{'offer':details(tier),'assumed_kwh':str(tq),'energy_with_tiers':str(real),'incorrect_energy_all_lower_price':str(tq*p1),'difference':str(real-tq*p1),'assumptions':'Only price quotaenergia, no quota fissa/regulated charges/taxes. Apply first3000kWh atfirstprice andremaining1500atsecondprice, perAUv5.0p63.'}}
    pathlib.Path(a.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result['percentage_discount'].items() if k not in ('plenitude','iren')},ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in result['consumption_tiers'].items() if k!='offer'},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
