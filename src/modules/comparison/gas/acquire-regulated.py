#!/usr/bin/env python3
"""Manual official gas simulation, synthetic Pescara 1200 Smc profile.
Cookies and request tokens stay in process memory. Only sanitized public costs
are written; raw HTML is inert evidence and is never executed.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import build_opener,HTTPCookieProcessor,Request,HTTPRedirectHandler
from urllib.parse import urlencode,urlparse
from http.cookiejar import CookieJar
from datetime import datetime,timezone
from hashlib import sha256
import json,re,html,sys
base='https://www.ilportaleofferte.it'; code=sys.argv[1] if len(sys.argv)>1 else '020237GSVML01XX0FLEXHOMEGASLIGHT'
if not re.fullmatch(r"[A-Za-z0-9_]{10,64}",code):raise ValueError("Invalid offer code")
class OfficialRedirect(HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,message,headers,url):
  parsed=urlparse(url)
  if parsed.scheme!='https' or parsed.hostname!='www.ilportaleofferte.it' or parsed.username or parsed.password:raise ValueError('Redirect outside official Portal')
  return super().redirect_request(request,fp,code,message,headers,url)
class Form(HTMLParser):
 def __init__(self):super().__init__();self.token='';self.active=False;self.fields={}
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='input' and d.get('name')=='csrf_token':self.token=d.get('value','')
  if t=='form':self.active=d.get('id')=='formDettaglioOffertaML'
  if self.active and t=='input' and 'name'in d:self.fields[d['name']]=d.get('value','')
 def handle_endtag(self,t):
  if t=='form':self.active=False
usage=sys.argv[2] if len(sys.argv)>2 else 'RISC'
if usage not in ['RISC','CC_AC']:raise ValueError('Invalid synthetic usage')
town_code=sys.argv[3] if len(sys.argv)>3 else '068028'
town_name=sys.argv[4] if len(sys.argv)>4 else 'Pescara'
volume=sys.argv[5] if len(sys.argv)>5 else '1200'
if not re.fullmatch(r'\d{6}',town_code) or not re.fullmatch(r'\d{1,6}',volume) or int(volume)<=0:raise ValueError('Invalid synthetic profile')
op=build_opener(OfficialRedirect(),HTTPCookieProcessor(CookieJar()));f=Form();f.feed(op.open(base+'/portaleOfferte/it/confronto-tariffe-prezzi-luce-gas.page?'+urlencode({'tipoOfferta':'gas','cap-comune':town_name,'code-istat':town_code,'fornitura':''}),timeout=45).read().decode());assert f.token
check={'offertaConfrontoRequest':{'codiceComune':town_code,'commodityType':'GAS','tipoCliente':'DOMESTICO','codiceOfferta':code}}
op.open(Request(base+'/portaleOfferte/api/rs/it/portal/offertaConfrontoService.json',data=json.dumps(check).encode(),headers={'Content-Type':'application/json'}),timeout=45).read()
d={'commodityType':'gas','codiceIstatComune':town_code,'capComuneDescr':town_name,'dove':'casa','codiceOffertaConfronto':code,'tipoOfferta':'prezzoVariabile','clienteVulnerabile':'NO','categoriaUsoCot':'CC','categoriaUsoAcq':'AC','categoriaUsoRisc':'RISC','classeContatore':'1','usaConsumi':'NO','conosciGas':'SI','ConsumoAnnuoGas':volume,'mesiGas':'0','categoriaOfferta':'ALL','scontiCondizionati':'00','sconti':'00','idAttivazioneOfferta':'ALL','advancedFilter':'false','statoMisure':'','misureMensili':'','csrf_token':f.token,'personeGas':'','superficieAbitazione':'','offertaName':'','codiceOfferta':'','prodServAggiuntivi':'','modalitaPagamento':''}
if usage=='CC_AC':d.pop('categoriaUsoRisc',None)
s=op.open(Request(base+'/portaleOfferte/it/confronta_offerte.page',data=urlencode(d).encode()),timeout=60).read().decode();f=Form();f.feed(s);pos=s.find('<p class="codice_offerta"><strong>cod. </strong>'+code);m=re.search(r'vaiAlDettaglioML\(false,(\d+),true,(\d+),',s[pos:]);assert pos>=0 and m,'Offer not available';f.fields.update(idOfferta=m[1],isOffertaConfronto='true',idTipoOfferta=m[2]);s=op.open(Request(base+'/portaleOfferte/it/dettaglio_offerta_ml.page',data=urlencode(f.fields).encode()),timeout=60).read().decode();profile_match=re.search(r"name=\"currentFilterJSON\"[^>]*value='(.*?)'",s,re.S)
profile=json.loads(html.unescape(profile_match[1])) if profile_match else {}
normalized={k:profile.get(k)for k in ['commodityType','consumoTotale','categoriaUsoCot','categoriaUsoAcq','categoriaUsoRisc','idCategoriaUso','codiceOffertaConfronto','classeContatore']}
assert normalized.get('consumoTotale')==int(volume) and normalized.get('codiceOffertaConfronto')==code,'Normalized profile or offer mismatch'
start=s.find('<h3 class="header_comp_sepsa"');ends=[v for v in [s.find('<script',start),s.find('</section>',start)]if v>start];cost=s[start:min(ends)];assert start>=0 and not re.search('csrf|currentFilterJSON|sessionid',cost,re.I);Path('/tmp/lmb-gas-current-'+code+'-'+usage+'-'+town_code+'-'+volume+'-cost.html').write_text(cost)
rows=[]
for row in re.findall(r'<tr[^>]*>(.*?)</tr>',cost,re.S):
 cells=[' '.join(html.unescape(re.sub('<[^>]+>',' ',x)).split())for x in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>',row,re.S)]
 if '<th' in row or any(re.search('CCR|QTint|QTpsv|QVD|GRAD|CPR',x,re.I)for x in cells):rows.append(cells)
print(json.dumps({'observedAt':datetime.now(timezone.utc).isoformat(),'offerCode':code,'usage':usage,'municipality':{'portalCode':town_code,'name':town_name},'volume':volume,'normalizedProfile':normalized,'sha256':sha256(cost.encode()).hexdigest(),'rows':rows},ensure_ascii=False))
