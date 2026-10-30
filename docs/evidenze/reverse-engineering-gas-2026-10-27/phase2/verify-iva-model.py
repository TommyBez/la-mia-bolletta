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
r=linprog(np.zeros(4),A_ub=A,b_ub=B,bounds=[(0,None)]*4,method='highs')
assert r.success,r.message
print('FEASIBLE quarterly hidden price candidate',r.x)
for p,c,s,z in OBS:
 a,b=coef(p,c);pred=z+(a@r.x+b)/10
 print(p,c,'observed',s,'prediction from rounded ordinaryIVA',pred)
for p,c,z in [('RISC',1500,62.68),('RISC',1300,None),('RISC',1350,62.68),('CC',100,None)]:
 a,b=coef(p,c)
 low=linprog(a,A_ub=A,b_ub=B,bounds=[(0,None)]*4,method='highs').fun
 high=-linprog(-a,A_ub=A,b_ub=B,bounds=[(0,None)]*4,method='highs').fun
 print('FORECAST',p,c,'I_S-I_control range',((low+b)/10,(high+b)/10),'SIVAifknownControl',None if z is None else (z+(low+b)/10-.005,z+(high+b)/10+.005))
# Out-of-sample checks: these observations were not used in A/B calibration.
checks=[]
for p,c,z,obs in [('RISC',1500,62.68,536.05),('CC',100,9.98,67.36)]:
 a,b=coef(p,c)
 low=linprog(a,A_ub=A,b_ub=B,bounds=[(0,None)]*4,method='highs').fun
 high=-linprog(-a,A_ub=A,b_ub=B,bounds=[(0,None)]*4,method='highs').fun
 lo=z+(low+b)/10-.005;hi=z+(high+b)/10+.005
 assert lo < obs+.005 and hi > obs-.005
 checks.append({'profile':p,'smc':c,'observed_S_IVA10':obs,'predicted_unrounded_interval':[lo,hi],'compatible':True})
for p,observed_delta in [('RISC',3.94),('CC',2.97)]:
 w=P[p];repeat=sum((12-i)*wi for i,wi in enumerate(w));expected=.1*.04*100*repeat
 assert abs(expected-observed_delta)<.01
 checks.append({'profile':p,'smc':100,'L_minus_S_IVA_observed':observed_delta,'predicted_unrounded_delta':expected,'compatible':True})
print('HOLDOUT_CHECKS',json.dumps(checks,indent=2))
# Second independent IVA22 check, not used to calibrate hidden quarterly prices.
delta_l10=.1*.04*10*sum((12-i)*wi for i,wi in enumerate(P['RISC']))
l10_lo=9.27-.005+delta_l10;l10_hi=9.27+.005+delta_l10
assert l10_lo < 9.66+.005 and l10_hi > 9.66-.005
iva22_lo=.22*(298.05-.01-l10_hi*10)
iva22_hi=.22*(298.05+.01-l10_lo*10)
assert iva22_lo < 44.32+.005 and iva22_hi > 44.32-.005
checks.append({'profile':'RISC','smc':10,'offer':'L','IVA10_observed':9.66,'IVA10_predicted_unrounded_interval':[l10_lo,l10_hi],'IVA22_observed':44.32,'IVA22_predicted_unrounded_interval':[iva22_lo,iva22_hi],'compatible':True})
result={'model':'Repeated cumulative first-480-Smc energy base in IVA10, ordinary non-energy base once; residual IVA22 clipped at zero','confidence':'Predictive behavioral model, not source-code proof or normative calculation','calibration_count':len(OBS),'calibration_observations':[dict(profile=p,smc=c,anomalous_iva10=s,ordinary_iva10=z) for p,c,s,z in OBS],'candidate_implicit_quarter_prices':dict(zip(['Q4','Q1','Q2','Q3'],r.x.tolist())),'prices_note':'One feasible candidate, not recovered official forward quotations; holdouts were excluded from fitting.','holdouts':checks}
from pathlib import Path
Path(__file__).with_name('iva-model-results.json').write_text(json.dumps(result,indent=2)+'\n')
print('IVA22_HOLDOUT',json.dumps(checks[-1]))
