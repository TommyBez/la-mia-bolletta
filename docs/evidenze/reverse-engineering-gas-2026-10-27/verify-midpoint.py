"""Reproduce inferred monthly-midpoint model, not official server source.
Official profile source: Regole calcolo spesa v4.2 5 October2026 p45
https://www.ilportaleofferte.it/portaleOfferte/resources/cms/documents/6bc502553cb0ea45958840b2de20078d.pdf
Observations: docs/simulazioni-due-offerte-2026-10-27.md and docs/evidenze/reverse-engineering-gas-2026-10-27/*.json.
No network. Decimal arithmetic. Index averages are fitted intervals, NOT published forwards.
"""
from decimal import Decimal as D, ROUND_HALF_UP
import json

MONTHS=['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep']
PROFILES={
 'C1D': ['0.0000003','14.1177804','21.7751921','24.9674109','18.9434624','13.2683819','6.9277704','0.0000003','0.0000003','0.0000003','0.0000003','0.0000003'],
 'C2': ['7.3264263','9.2534510','12.2896316','13.4804629','11.2326411','11.0295041','7.4275383','6.1823497','5.4497245','5.1209326','5.2648205','5.9425175']
}
# (C, observed PN sales, observed Senza sales or None)
CONTROLS={'C1D': (1200,'1173.35'), 'C2': (1200,'1087.44')}
# ZERO FLEX GAS 000971GSVML01XXPROD1300109202600:174/year, zero spread, PSV14.
OBS={
 'C1D': [(500,'536.40','600.40'),(1000,'952.79','1056.79'),(1001,'953.63',None),
          (1100,'1043.69',None),(1157,'1091.56',None),(1159,'1108.62','1201.93'),
          (1200,'1143.59','1239.35'),(1400,'1314.19','1421.91'),
          (1422,'1332.95',None),(1424,'1361.63',None),(1500,'1427.90',None),
          (2000,'1863.87','1969.59')],
 'C2': [(1200,'1055.68','1153.44')]
}

def residual(c, profile, threshold=D('1001'), start=1):
    c=D(c); cumulative=D(0); amount=D(0); selected=[]
    for j in range(12):
        i=(start+j)%12
        w=D(PROFILES[profile][i])/100
        representative=c*(cumulative+w/2)
        if representative >= threshold:
            amount += c*w*D('.10')
            selected.append(MONTHS[i])
        cumulative += w
    return amount,selected

def rounded(x):
    return str(x.quantize(D('.01'),rounding=ROUND_HALF_UP))

out={}
for profile,rows in OBS.items():
    # Derive allowable index mean interval ONLY from Senza observations;
    # PN does not influence this baseline interval.
    lower=D('-Infinity');upper=D('Infinity')
    for c,pn,s in rows:
        if s:
            lower=max(lower,(D(s)-D('.005')-144-D('.08')*c)/c)
            upper=min(upper,(D(s)+D('.005')-144-D('.08')*c)/c)
    control_c,control_sale=CONTROLS[profile]
    control_lower=(D(control_sale)-D('.005')-174)/control_c
    control_upper=(D(control_sale)+D('.005')-174)/control_c
    records=[]; shared_lower=max(lower,control_lower);shared_upper=min(upper,control_upper)
    for c,pn,s in rows:
        r,selected=residual(c,profile)
        mean_lo=(D(pn)-D('.005')-120-r)/c
        mean_hi=(D(pn)+D('.005')-120-r)/c
        shared_lower=max(shared_lower,mean_lo);shared_upper=min(shared_upper,mean_hi)
        records.append({'smc':c,'selected_months':selected,'spread_residual':str(r),
          'pn_observed':pn,'senza_observed':s,
          'pn_prediction_min_from_senza':rounded(120+lower*c+r),
          'pn_prediction_max_from_senza':rounded(120+upper*c+r),
          'compatible_with_senza_index_interval':max(mean_lo,lower)<min(mean_hi,upper)})
    assert shared_lower < shared_upper, (profile,shared_lower,shared_upper)
    representative_mean=(shared_lower+shared_upper)/2
    for record in records:
        c=record['smc'];r=D(record['spread_residual'])
        predicted=rounded(120+representative_mean*c+r)
        assert predicted==record['pn_observed'],(profile,c,predicted)
        if record['senza_observed']:
            assert rounded(144+(representative_mean+D('.08'))*c)==record['senza_observed']
        record['pn_reproduced_with_shared_mean']=predicted
    out[profile]={'index_mean_interval_from_senza':[str(lower),str(upper)],
                  'shared_index_mean_interval_all_observations':[str(shared_lower),str(shared_upper)],
                  'independent_zero_flex_control': {'smc':control_c,'sale':control_sale,'implicit_index_interval':[str(control_lower),str(control_upper)]},
                  'note':'This is an implicit weighted annual mean, not an official forward curve. Interval upper bounds are exclusive.',
                  'rows':records}
print(json.dumps(out,indent=2))
