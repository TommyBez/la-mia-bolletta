#!/usr/bin/env python3
"""Bounded economic examples from the gas XML; no full annual-bill ranking."""
import argparse,json,xml.etree.ElementTree as ET
from decimal import Decimal as D
from audit_gas import compact

def text(e,p):return e.findtext(p)
def get_price(c,unit):
 v=c.find('IntervalloPrezzi');assert v.findtext('UNITA_MISURA')==unit
 assert len(c.findall('IntervalloPrezzi'))==1
 return D(v.findtext('PREZZO'))
def sale_parts(o):
 fixed=D(0);unit=D(0);bonus=D(0)
 for c in o.findall('ComponenteImpresa'):
  assert text(c,'TIPOLOGIA')=='01'
  m=text(c,'MACROAREA')
  if m=='01':fixed+=get_price(c,'01')
  elif m in ['02','04']:unit+=get_price(c,'04')
  else:raise ValueError('Unexpected component')
 for s in o.findall('Sconto'):
  assert text(s,'VALIDITA')in ['01','02'] and text(s,'Condizione/CONDIZIONE_APPLICAZIONE')=='00'
  assert text(s,'IVA_SCONTO')=='01' and text(s,'PrezziSconto/TIPOLOGIA')=='01'
  assert text(s,'PrezziSconto/UNITA_MISURA')in ['01','05'] and s.find('PeriodoValidita')is None
  bonus+=D(text(s,'PrezziSconto/PREZZO'))
 assert text(o,'DettaglioOfferta/DURATA')=='12'
 assert not o.findall('ZoneOfferta/*') and not o.findall('CaratteristicheOfferta/*')
 assert not o.findall('ComponentiRegolate/CODICE')
 assert len(o.findall('RiferimentiPrezzoEnergia'))==1 and text(o,'RiferimentiPrezzoEnergia/IDX_PREZZO_ENERGIA')=='14'
 assert o.find('RiferimentiPrezzoEnergia/COEFFICIENTE')is None
 assert all(text(c,'LIMITANTE')=='02'for c in o.findall('CondizioniContrattuali'))
 return fixed,unit,bonus

def run(path):
 root=ET.parse(path).getroot()
 for e in root.iter():e.tag=e.tag.split('}')[-1]
 offers={text(o,'IdentificativiOfferta/COD_OFFERTA'):o for o in root}
 codes=['027208GSVML01XX00000000000033846','028330GSVML01XXDOPSV26091A010500']
 parts=[sale_parts(offers[c])for c in codes];q=D(1400)
 same_profile=[]
 for code,(fixed,unit,bonus) in zip(codes,parts):
  o=offers[code]
  same_profile.append({'code':code,'name':text(o,'DettaglioOfferta/NOME_OFFERTA'),'fixed_eur_year':str(fixed),'unit_eur_smc':str(unit),'bonus_eur':str(bonus),'commercial_before_bonus_excluding_common_index':str(fixed+unit*q),'commercial_after_bonus_excluding_common_index':str(fixed+unit*q-bonus)})
 assert (parts[0][0]+q*parts[0][1])>(parts[1][0]+q*parts[1][1])
 assert (parts[0][0]+q*parts[0][1]-parts[0][2])<(parts[1][0]+q*parts[1][1]-parts[1][2])
 edison=offers['000190GSVML13XXLGSPGX001X14XXXX5'];ec=[c for c in edison.findall('ComponenteImpresa') if text(c,'MACROAREA')=='04'][0];ev=ec.findall('IntervalloPrezzi')
 first=next(v for v in ev if text(v,'CONSUMO_DA')=='0');second=next(v for v in ev if text(v,'CONSUMO_DA')=='701');default=next(v for v in ev if v.find('CONSUMO_DA')is None)
 tier1=D(text(first,'CONSUMO_A'));cost1=min(q,tier1)*D(text(first,'PREZZO'));cost2=max(q-tier1,D(0))*D(text(second,'PREZZO'));flat=q*D(text(default,'PREZZO'))
 altis=offers['000579GSVML25XXPSVVARIABILED2025'];ac=next(c for c in altis.findall('ComponenteImpresa') if text(c,'MACROAREA')=='02');av=ac.findall('IntervalloPrezzi');period=next(v for v in av if v.find('PeriodoValidita')is not None);base=next(v for v in av if v.find('PeriodoValidita')is None)
 assert text(period,'PeriodoValidita/DURATA')=='12' and q<=D(text(period,'CONSUMO_A'))
 return {'assumptions':['1,400 Smc over 12 months; domestic switching, supply active throughout first year','Direct debit and digital bill; both comparison offers declare no geography or consumption limit in source','Shared monthly PSV price path, same customer/territory; no numeric forward price invented','Amounts below exclude common index cost, network, general charges and taxes; this is a commercial component comparison, not a total bill or market ranking','Union fidelity bonus requires reaching month 12; GASXPLUS textual bonus condition requires 12 consecutive active months; both assumed fulfilled','Source fields are vendor declarations; a full signed-contract verification was not performed'], 'bonus_order_reversal':same_profile,'edison_tier_case':{'code':text(edison,'IdentificativiOfferta/COD_OFFERTA'),'volume_smc':str(q),'structured_tier_contribution_eur':str(cost1+cost2),'naive_default_only_eur':str(flat),'difference_eur':str(cost1+cost2-flat)},'altis_period_case':{'code':text(altis,'IdentificativiOfferta/COD_OFFERTA'),'volume_smc':str(q),'first_12_month_contribution_eur':str(q*D(text(period,'PREZZO'))),'naive_default_only_eur':str(q*D(text(base,'PREZZO'))),'difference_eur':str(q*(D(text(period,'PREZZO'))-D(text(base,'PREZZO'))))},'source_records':{c:compact(offers[c]) for c in codes+[text(edison,'IdentificativiOfferta/COD_OFFERTA'),text(altis,'IdentificativiOfferta/COD_OFFERTA')]}}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('xml');ap.add_argument('--output',default='/tmp/gas-economic-cases.json');a=ap.parse_args();result=run(a.xml)
 open(a.output,'w').write(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
 print(json.dumps({k:v for k,v in result.items()if k!='source_records'},indent=2,ensure_ascii=False))
