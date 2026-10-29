from html.parser import HTMLParser
from pathlib import Path
from urllib.request import build_opener,HTTPCookieProcessor,Request
from urllib.parse import urlencode
from http.cookiejar import CookieJar
import json,re,sys,time,html
base='https://www.ilportaleofferte.it'
class P(HTMLParser):
 def __init__(self):super().__init__();self.token='';self.active=False;self.d={}
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='input' and d.get('name')=='csrf_token':self.token=d.get('value','')
  if t=='form':self.active=d.get('id')=='formDettaglioOffertaML'
  if self.active and t=='input' and 'name'in d:self.d[d['name']]=d.get('value','')
 def handle_endtag(self,t):
  if t=='form':self.active=False
code=sys.argv[1];vol=sys.argv[2];usage=sys.argv[3] if len(sys.argv)>3 else 'RISC'
op=build_opener(HTTPCookieProcessor(CookieJar()))
url=base+'/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?tipoOfferta=gas&cap-comune=Pescara&code-istat=068028&fornitura='
p=P();p.feed(op.open(url,timeout=30).read().decode())
v={'offertaConfrontoRequest':{'codiceComune':'068028','commodityType':'GAS','tipoCliente':'DOMESTICO','codiceOfferta':code}}
val=json.loads(op.open(Request(base+'/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json',data=json.dumps(v).encode(),headers={'Content-Type':'application/json'}),timeout=30).read())
d={'commodityType':'gas','codiceIstatComune':'068028','capComuneDescr':'Pescara','dove':'casa','codiceOffertaConfronto':code,'tipoOfferta':'prezzoVariabile','clienteVulnerabile':'NO','categoriaUsoCot':'CC','categoriaUsoAcq':'AC','classeContatore':'1','usaConsumi':'NO','conosciGas':'SI','ConsumoAnnuoGas':vol,'mesiGas':'0','categoriaOfferta':'ALL','scontiCondizionati':'00','sconti':'00','idAttivazioneOfferta':'ALL','advancedFilter':'false','statoMisure':'','misureMensili':'','csrf_token':p.token,'personeGas':'','superficieAbitazione':'','offertaName':'','codiceOfferta':'','prodServAggiuntivi':'','modalitaPagamento':''}
if usage=='RISC':d['categoriaUsoRisc']='RISC'
s=op.open(Request(base+'/portaleOfferte/it/confronta_offerte.page',data=urlencode(d).encode()),timeout=30).read().decode()
p=P();p.feed(s)
i=s.find('<p class="codice_offerta"><strong>cod. </strong>'+code)
m=re.search(r'vaiAlDettaglioML\(false,(\d+),true,(\d+),\)',s[i:]);assert i>=0 and m,'offer not found'
p.d.update(idOfferta=m[1],isOffertaConfronto='true',idTipoOfferta=m[2])
s=op.open(Request(base+'/portaleOfferte/it/dettaglio_offerta_ml.page',data=urlencode(p.d).encode()),timeout=30).read().decode()
rows=[]
for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',s,re.S):
 if '<th' in row:rows.append(' '.join(html.unescape(re.sub('<[^>]+>',' ',row)).split()))
sp=re.search(r'Vendita di gas naturale</th>.*?<strong>€ ([\d.,]+)</strong>',s,re.S)
r={'code':code,'volume':float(vol),'usage':usage,'idTipoOfferta':m[2],'sale':sp.group(1) if sp else None,'rows':rows}
out=Path('/tmp/lmb-re-results');out.mkdir(exist_ok=True)
(out/f'{code}-{vol}-{usage}.json').write_text(json.dumps(r,indent=2))
# retain only cost table, no session or request credentials
start=s.find('<h3 class="header_comp_sepsa"');end=s.find('</section>',start)
(out/f'{code}-{vol}-{usage}-cost.html').write_text(s[start:end if end>start else s.find('<footer',start)])
print(json.dumps(r))
