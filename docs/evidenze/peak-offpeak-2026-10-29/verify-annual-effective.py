from pathlib import Path
from decimal import Decimal as D
import json
r=Path(__file__).resolve().parent
base='029878ESVFL03XX000002DOM2VAR2BIO'
c1=(D('843.22')-144)/3000;c3=(D('849')-144)/3000;c2=(D('845.50')-144)/1000-c1-c3
coefs=[c1,c2,c3]
checks=[]
def read(label,code,bands):
 p=r/label/f"profile-{code}-{'-'.join(str(x) for x in bands)}.json"
 v=json.loads(p.read_text());s=D(v['rows'][0].split('€')[1].strip().replace('.','').replace(',','.'))
 assert v['requested_bands']==bands
 assert v['profile']['consumiEE']['consF0']==sum(bands)
 return v,s
def test(label,code,bands,A,bs):
 v,obs=read(label,code,bands);pred=A+sum(D(q)*b for q,b in zip(bands,bs))
 assert abs(pred-obs)<=D('.02'),(code,bands,pred,obs)
 checks.append({'code':code,'bands':bands,'predicted':str(pred),'observed':str(obs),'residual':str(obs-pred),'label':label})
for code,A,delta in [(base,D('144'),D(0)),('029878ESVFL03XX000000DOM8VAR8BIO',D('192'),D(0)),('029878ESVFL05XX000007DOM7VAR7BIO',D('144'),D(0)),('030032ESVOL01XX0000000000E000041',D('144'),D('-.0242'))]:
 test('annual',code,[1234,987,1779],A,[b+delta for b in coefs])
for bands in [[0,3000,0],[1500,2000,2500],[700,400,900]]:test('annual',base,bands,D(144),coefs)
std='024632ESVFL01XXSTDDOMVARPOP00007';A=D('194.30')
bs=[(D(s)-A)/3000 for s in ['990.91','993.21','985.61']]
for bands in [[1234,987,1779],[1500,2000,2500],[700,400,900],[876,543,2100]]:test('annual',std,bands,A,bs)
test('other-residence-power',std,[876,543,2100],A,bs)
for code,sales in [('003450ESFML01XX00000010073721026',['708.93','688.60','654.73']),('003450ESFML01XX00000010073781026',['701.84','681.47','648.03'])]:
 bs=[(D(s)-D('133.2311'))/3000 for s in sales]
 test('fixed',code,[1200,700,2000],D('133.2311'),bs)
for label in ['monthly/202512','monthly/202605','custom-config/202512']:
 v,obs=read(label,base,[3000,0,0]);assert obs==D('843.22')
v,obs=read('monthly/mixedholdout',base,[1000,1000,1000]);assert obs==D('845.50')
print(json.dumps({'checks':checks,'all_selected_checks_pass':True,'warning':'Annual effective sale coefficients; not recovered raw quarter Peak/Off curves. Failed exploratory PPE scalar fit excluded from recipe, retained in predictions file.'},indent=2))
