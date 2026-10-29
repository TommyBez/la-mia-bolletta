from pathlib import Path
import json,re,html,unicodedata,collections,hashlib,csv
from decimal import Decimal
from openpyxl import load_workbook
ROOT=Path(__file__).resolve().parent

def norm(x):
 x=unicodedata.normalize('NFKD',x).encode('ascii','ignore').decode().upper()
 return re.sub('[^A-Z0-9]','',x)
# Immutable normative HTML includes inert escaped article text in a JS string.
# Decode only delimiters; never eval or execute target content.
s=(ROOT/'raw/DPR412-allegatoA.html').read_text().replace('\\/','/').replace("\\'", "'").replace('\\"','"')
region_labels={norm(name):str(i).zfill(2) for i,name in enumerate(['Piemonte',"Valle d'Aosta",'Lombardia','Trentino Alto Adige','Veneto','Friuli Venezia Giulia','Liguria','Emilia Romagna','Toscana','Umbria','Marche','Lazio','Abruzzo','Molise','Campania','Puglia','Basilicata','Calabria','Sicilia','Sardegna'],1)}
climate=[];unparsed=[];normative_region=None
for p in re.findall(r'<p\b[^>]*>(.*?)</p>',s,re.S|re.I):
 t=' '.join(html.unescape(re.sub('<[^>]+>',' ',p)).split())
 if norm(t) in region_labels:normative_region=region_labels[norm(t)]
 if not re.match(r'^[A-Z]{2}\s+[A-F]\s+',t):continue
 m=re.match(r'^([A-Z]{2})\s+([A-F])\s+(\S+)\s+(\S+)\s+(.+)$',t)
 if not m:unparsed.append(t);continue
 province,zone,gg,alt,name=m.groups()
 climate.append({'region_code_from_heading':normative_region,'province_original':province,'climate_zone':zone,'degree_days_raw':gg,'altitude_raw':alt,'name_original':name,'line_original':t})
(ROOT/'climate-normative-rows.json').write_text(json.dumps(climate,ensure_ascii=False,indent=2))
byname=collections.defaultdict(list)
for c in climate:byname[norm(c['name_original'])].append(c)
# RTDG seven geographic areas; codes are our stable semantic keys, not undocumented Portal numeric codes.
areas={
 '01':'north_west','02':'north_west','07':'north_west',
 '03':'north_east','04':'north_east','05':'north_east','06':'north_east','08':'north_east',
 '09':'central','10':'central','11':'central',
 '13':'central_south_east','14':'central_south_east','16':'central_south_east','17':'central_south_east',
 '12':'central_south_west','15':'central_south_west','18':'south','19':'south','20':'sardinia'}
wb=load_workbook(ROOT/'raw/istat-comuni.xlsx',read_only=True,data_only=True)
rows=list(wb.active.values);municipalities=[];unmatched=[];ambiguous=[]
for row in rows[1:]:
 if not row[4] or not re.fullmatch(r'\d{6}',str(row[4])):continue
 code=str(row[4]);region=str(row[0]).zfill(2)
 d={'istat_code':code,'italian_name':row[6],'full_name':row[5],'region_code':region,'region_name':row[10],'province_statistical_code':str(row[1]),'province_historical_code':str(row[2]),'province_name':row[11],'province_abbreviation':row[14],'cadastral_code':row[20],'gas_geographic_area':areas[region],'istat_source_as_of':'2026-02-21','istat_code_encodings_by_province_layout':{str(y):str(row[i]).zfill(6) for y,i in [(2025,16),(2016,17),(2009,18),(2005,19)] if row[i] is not None}}
 candidates=[]
 for name in [row[6],row[5],row[7]]:
  if name:candidates+=byname.get(norm(name),[])
 unique={c['line_original']:c for c in candidates};candidates=list(unique.values())
 sameprov=[c for c in candidates if c['province_original']==row[14]]
 sameregion=[c for c in candidates if c['region_code_from_heading']==region]
 chosen=sameprov or sameregion or candidates
 zones={c['climate_zone'] for c in chosen}
 if len(zones)==1:
  d.update(climate_zone=next(iter(zones)),climate_match='exact_normalized_name_province' if sameprov else ('exact_normalized_name_region' if sameregion else 'exact_normalized_name_single_zone'),climate_evidence=[c['line_original'] for c in chosen],climate_status='normative_name_match_requires_currency_validation')
 elif len(zones)>1:
  d.update(climate_zone=None,climate_status='ambiguous_normative_rows',climate_evidence=[c['line_original'] for c in chosen]);ambiguous.append(d)
 else:d.update(climate_zone=None,climate_status='missing_name_in_normative_table');unmatched.append(d)
 municipalities.append(d)
assert len(municipalities)==7894,len(municipalities)
assert len({d['istat_code'] for d in municipalities})==7894
assert all(d['gas_geographic_area'] for d in municipalities)
(ROOT/'municipalities.json').write_text(json.dumps(municipalities,ensure_ascii=False,indent=2))
(ROOT/'unresolved-climate.json').write_text(json.dumps({'missing':unmatched,'ambiguous':ambiguous,'unparsed_normative_lines':unparsed},ensure_ascii=False,indent=2))
report={'istat_municipalities':len(municipalities),'istat_unique':len({d['istat_code'] for d in municipalities}),'region_area_coverage':len(municipalities),'regions':len({d['region_code'] for d in municipalities}),'gas_geographic_areas':dict(collections.Counter(d['gas_geographic_area'] for d in municipalities)),'normative_climate_rows':len(climate),'climate_exact_name_matches':len(municipalities)-len(unmatched)-len(ambiguous),'climate_missing':len(unmatched),'climate_ambiguous':len(ambiguous),'status':'All current ISTAT→region/area materialized. Climate join provisional, historical normative names not certification of current municipal acts. Missing mappings not fabricated.'}
(ROOT/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,indent=2))
# Extract 12-month gas profiles directly from saved AU source table.
source=ROOT/'raw/AU-regole-calcolo-v4.2.txt';text=source.read_text();a=text.index('Profili di Prelievo GAS anno termico 2026/2027');b=text.index('--- PAGINA 46 ---',a);table=text[a:b]
profiles=[]
patterns=list(re.finditer(r'\b(C1\s+[B-F]|C2|T1)\b',table))
for i,m in enumerate(patterns):
 block=table[m.end():patterns[i+1].start() if i+1<len(patterns) else len(table)]
 values=re.findall(r'\d+,\d{7}',block)
 assert len(values)==12,(m.group(),values)
 dec=[Decimal(v.replace(',','.')) for v in values]
 assert abs(sum(dec)-100)<=Decimal('.000001'),(m.group(),sum(dec))
 profiles.append({'profile':re.sub(r'\s+',' ',m.group()),'months':['2026-10','2026-11','2026-12']+[f'2027-{j:02d}' for j in range(1,10)],'percentages':[str(v) for v in dec],'sum_percent':str(sum(dec))})
assert len(profiles)==7
(ROOT/'gas-profiles-2026-2027.json').write_text(json.dumps({'source':'AU v4.2 p45','profiles':profiles,'climate_A':'No C1 A row in published table; do not silently substitute B.'},indent=2))
print('Gas profiles',len(profiles),'sums',[p['sum_percent'] for p in profiles])
