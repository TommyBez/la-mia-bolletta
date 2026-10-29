import xml.etree.ElementTree as E,json,itertools,collections
from pathlib import Path
ns={'n':'http://www.acquirenteunico.it/schemas/SII_AU/OffertaRetail/01'}
def txt(e,k):return e.findtext('n:'+k,'',ns)
def obj(e):
 return {c.tag.split('}')[-1]:(obj(c) if len(c) else c.text) for c in e}
def period(e):
 p=e.find('n:PeriodoValidita',ns)
 return obj(p) if p is not None else None
def bounds(e):return bool(txt(e,'CONSUMO_DA') or txt(e,'CONSUMO_A'))
def default(e):return not bounds(e) and period(e) is None
out=[];counts={}
for day,market in [('20261001','G'),('20261026','G'),('20261026','E'),('20261027','G'),('20261027','E')]:
 root=E.parse(f'/tmp/la-mia-bolletta-{day}-{market}.xml').getroot();counts[day+market]=len(root)
 for o in root:
  d=o.find('n:DettaglioOfferta',ns);ident=o.find('n:IdentificativiOfferta',ns)
  for co in o.findall('n:ComponenteImpresa',ns):
   ints=co.findall('n:IntervalloPrezzi',ns)
   for (a,x),(b,y) in itertools.combinations(enumerate(ints),2):
    if txt(x,'FASCIA_COMPONENTE')!=txt(y,'FASCIA_COMPONENTE') or txt(x,'UNITA_MISURA')!=txt(y,'UNITA_MISURA'):continue
    px,py=period(x),period(y)
    if txt(x,'PREZZO')==txt(y,'PREZZO') and txt(x,'TIPO_PREZZO')==txt(y,'TIPO_PREZZO') and px==py:continue
    lo=max(float(txt(x,'CONSUMO_DA') or 0),float(txt(y,'CONSUMO_DA') or 0));hi=min(float(txt(x,'CONSUMO_A') or 'inf'),float(txt(y,'CONSUMO_A') or 'inf'))
    if lo>hi:continue
    if default(x)!=default(y):kind='default-vs-specific'
    elif px==py:kind='same-period-overlap'
    else:kind='different-periods-needs-review'
    out.append({'day':day,'market':market,'code':txt(ident,'COD_OFFERTA'),'name':txt(d,'NOME_OFFERTA'),'client':txt(d,'TIPO_CLIENTE'),'type':txt(d,'TIPO_OFFERTA'),'component':txt(co,'NOME'),'macro':txt(co,'MACROAREA'),'kind':kind,'a_index':a,'b_index':b,'first':obj(x),'second':obj(y),'first_price_higher':float(txt(x,'PREZZO'))>float(txt(y,'PREZZO')),'overlap':[lo,str(hi)]})
Path('/tmp/lmb-overlap-v2-candidates.json').write_text(json.dumps({'record_counts':counts,'pairs':out},indent=2))
print('COUNTS',counts,'KINDS',dict(collections.Counter(x['kind'] for x in out)))
for x in out:
 if x['kind']=='different-periods-needs-review' or (x['kind']=='same-period-overlap' and x['first_price_higher']): print(json.dumps(x))
