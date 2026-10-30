"""Experimental model; run with Python plus NumPy. No network.
Official profiles: Regole calcolo v4.2 p45. Calibration and holdouts remain separate.
"""
import numpy as np,json
from itertools import combinations
from types import SimpleNamespace
def linprog(c,A_ub,b_ub,bounds=None,method=None):
 A=np.array(list(A_ub)+list(-np.eye(4)));b=np.array(list(b_ub)+[0]*4);vs=[]
 for ids in combinations(range(len(b)),4):
  try:x=np.linalg.solve(A[list(ids)],b[list(ids)])
  except np.linalg.LinAlgError:continue
  if np.all(A@x<=b+1e-7):vs.append(x)
 if not vs:return SimpleNamespace(success=False,message="infeasible")
 x=min(vs,key=lambda x:np.dot(c,x));return SimpleNamespace(success=True,x=x,fun=np.dot(c,x))
P={'RISC':np.array([.141177804,.217751921,.249674109,.189434624,.132683819,.069277704,.000000003,.000000003,.000000003,.000000003,.000000003,.000000003]),'CC':np.array([9.2534510,12.2896316,13.4804629,11.2326411,11.0295041,7.4275383,6.1823497,5.4497245,5.1209326,5.2648205,5.9425175,7.3264263])/100}
Q=[0,0,1,1,1,2,2,2,3,3,3,0]
OBS=[('RISC',100,92.67,10.69),('RISC',500,463.26,61.94),('RISC',1000,516.44,62.51),('RISC',1159,524.67,62.59),('RISC',1200,526.79,62.61),('RISC',1400,534.72,62.68),('RISC',2000,542.66,62.68),('CC',1200,497.33,62.37)]
def coef(profile,c):
 w=P[profile];q=np.minimum(c*w,np.maximum(480-c*np.r_[0,np.cumsum(w)[:-1]],0))
 a=np.array([sum(q[j]*(11-j) for j in range(12) if Q[j]==k) for k in range(4)])
 b=.08*sum(q[j]*(12-j) for j in range(12))
 return a,b
A=[];B=[]
for p,c,s,z in OBS:
 a,b=coef(p,c);target=10*(s-z)-b
 A.extend([a,-a]);B.extend([target+.1,-target+.1])
for p,lo,hi in [('RISC',.8327925,.832795),('CC',.7611958333333333,.7612041666666667)]:
 a=np.array([sum(w for j,w in enumerate(P[p]) if Q[j]==k) for k in range(4)])
 A.extend([a,-a]);B.extend([hi,-lo])

from pathlib import Path
import re
here=Path(__file__).parent
initialA=list(A);initialB=list(B)
def vertices(aa,bb):
 aa=np.array(list(aa)+list(-np.eye(4)));bb=np.array(list(bb)+[0]*4);vv=[]
 for ids in combinations(range(len(bb)),4):
  try:x=np.linalg.solve(aa[list(ids)],bb[list(ids)])
  except np.linalg.LinAlgError:continue
  if np.all(aa@x<=bb+1e-7):vv.append(x)
 assert vv,"Infeasible"
 return np.array(vv)
def extrema(vv,a):
 q=vv@a;return [float(min(q)),float(max(q))]
v0=vertices(A,B)
res={"calibration_count":len(OBS),"rank":int(np.linalg.matrix_rank(np.array(A))),"initial_bounds":{n:extrema(v0,np.eye(4)[i]) for i,n in enumerate(["Q4","Q1","Q2","Q3"])},"new_holdouts":[]}
def num(t):return float(t.replace(".","").replace(",","."))
def read(code,c,p,ty):
 d=json.loads((here/f"{code}-{c}-{p}-type{ty}.json").read_text());prof=d["profile"]
 assert prof["consumoTotale"]==c and prof["consumoGAS"]==c
 assert prof["categoriaUsoRisc"]==(p=="RISC") and prof["categoriaUsoCot"] and prof["categoriaUsoAcq"]
 iva=num(next(re.search(r"IVA 10% ([\d.,]+)",r).group(1) for r in d["rows"] if r.startswith("IVA 10%")))
 return d,num(d["sale"]),iva
for p,c in [("CC",2000),("RISC",1350),("CC",480)]:
 z,zsale,ziva=read("000971GSVML01XXPROD1300109202600",c,p,"02")
 ss,ssale,siva=read("029886GSVML01XXSENZAPENSIDOMGAS3",c,p,"03")
 a,b=coef(p,c);diff=siva-ziva;pred=[(v+b)/10 for v in extrema(v0,a)]
 assert pred[0]-.01<=diff<=pred[1]+.01
 mean=np.array([sum(w for j,w in enumerate(P[p]) if Q[j]==k) for k in range(4)])
 saleint=[174+c*v for v in extrema(v0,mean)]
 assert saleint[0]-.005<=zsale<=saleint[1]+.005
 assert abs(ssale-zsale-(-30+.08*c))<.011
 res["new_holdouts"].append({"profile":p,"smc":c,"ZERO_sale":zsale,"S_sale":ssale,"ZERO_IVA10":ziva,"S_IVA10":siva,"observed_IVA10_difference":diff,"predicted_unrounded_difference_interval":pred,"ZERO_sale_predicted_unrounded_interval":saleint,"compatible":True})
 # All new observations enter ONLY the later refinement after holdout checks against v0.
 target=10*diff-b;A.extend([a,-a]);B.extend([target+.100001,-target+.100001])
 target=(zsale-174)/c;eps=.005001/c;A.extend([mean,-mean]);B.extend([target+eps,-target+eps])
v1=vertices(A,B)
res["refined_bounds_after_holdouts"]={n:extrema(v1,np.eye(4)[i]) for i,n in enumerate(["Q4","Q1","Q2","Q3"])}
res["feasible_candidate_after_holdouts"]=dict(zip(["Q4","Q1","Q2","Q3"],v1.mean(axis=0).tolist()))
res["note"]="Conditional implicit quarterly coefficients under empirical IVA model and month-to-quarter mapping, not direct AU publication; same calibration model unchanged for new holdouts."
(here/"bounds-and-holdouts.json").write_text(json.dumps(res,indent=2))
print(json.dumps(res,indent=2))
