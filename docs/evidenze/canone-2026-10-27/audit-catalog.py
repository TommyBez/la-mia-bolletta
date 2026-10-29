#!/usr/bin/env python3
"""Research audit of official XML and public non-comparable-offer HTML only.
No requests are made. Supplier URLs are never followed.
"""
import argparse, collections, datetime, hashlib, html, json, pathlib, re
import xml.etree.ElementTree as ET

RATE = re.compile(r'\brata\s+(?:fissa|costante|finanziaria|mensile)\b|\brate\s+fisse\b|undici fatture mensili di pari importo', re.I)
WORDS = {'canone': r'\bcanon[ei]\b', 'rata': r'\brat[ae]\b', 'flat': r'\bflat\b', 'taglia': r'\btagli[ae]\b'}

def metadata(path):
    b=path.read_bytes()
    return {'path':str(path),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}

def xml_audit(path, day):
    root=ET.parse(path).getroot()
    for e in root.iter(): e.tag=e.tag.split('}')[-1]
    rows=[]
    for o in root:
        get=lambda p:o.findtext(p)
        domestic=get('DettaglioOfferta/TIPO_CLIENTE')=='01'
        single=get('DettaglioOfferta/OFFERTA_SINGOLA')=='SI'
        switch=bool({e.text for e in o.findall('DettaglioOfferta/TIPOLOGIA_ATT_CONTR')}&{'01','99'})
        start=datetime.datetime.strptime(get('ValiditaOfferta/DATA_INIZIO'),'%d/%m/%Y_%H:%M:%S').date()
        end=datetime.datetime.strptime(get('ValiditaOfferta/DATA_FINE'),'%d/%m/%Y_%H:%M:%S').date()
        text=' '.join(e.text or '' for e in o.iter() if len(e)==0 and e.tag not in ('URL_OFFERTA','URL_SITO_VENDITORE'))
        rows.append({'code':get('IdentificativiOfferta/COD_OFFERTA'),'name':get('DettaglioOfferta/NOME_OFFERTA'),
                     'supplier_vat':get('IdentificativiOfferta/PIVA_UTENTE'),'offer_type':get('DettaglioOfferta/TIPO_OFFERTA'),
                     'domestic':domestic,'in_scope':domestic and single and switch and start<=day<=end,
                     'rate_phrase':bool(RATE.search(text)), 'keywords':{k:bool(re.search(v,text,re.I)) for k,v in WORDS.items()}})
    scopes={'all':rows,'domestic':[r for r in rows if r['domestic']], 'scope':[r for r in rows if r['in_scope']]}
    result={}
    for label, items in scopes.items():
        result[label]={'offers':len(items),'types':dict(collections.Counter(r['offer_type']for r in items)),
                       'keyword_offers':{k:sum(r['keywords'][k]for r in items)for k in WORDS},
                       'rate_phrase_offers':sum(r['rate_phrase']for r in items),
                       'rate_phrase_suppliers':len({r['supplier_vat']for r in items if r['rate_phrase']})}
    return {'source':metadata(path),'global_special_tags':dict(collections.Counter(e.tag for e in root.iter() if any(k in e.tag for k in ('CANONE','ONNICOM','FLAT')))),
            'scopes':result,'rate_phrase_records':[r for r in rows if r['domestic']and r['rate_phrase']]}

def plain(value):
    return ' '.join(html.unescape(re.sub('<[^>]+>',' ',value)).split())

def find(pattern,value):
    m=re.search(pattern,value,re.S)
    return plain(m.group(1))if m else None

def html_audit(path, supply):
    text=path.read_text()
    assert '</html>' in text.lower(), 'Incomplete source document'
    declared=int(find(r'<span class="badge">(.*?)</span>',text))
    records=[]
    for block in re.split(r'<div data-count="\d+"[^>]*>',text)[1:]:
        desc=find(r'<div class="modal-body modal-mt-text">(.*?)</div>',block)or ''
        record={'page_modal_id':find(r'data-target="#(modal-\d+)"',block),
                'name':find(r'<p class="nome_offerta">(.*?)</p>',block),
                'vendor':find(r'<p class="nome_venditore">(.*?)</p>',block),
                'validity_text':find(r'<p class="valid_date">(.*?)</p>',block),
                'description_sha256':hashlib.sha256(desc.encode()).hexdigest()}
        if record['vendor']=='Fastweb S.p.A.':
            record['annual_fee_text_eur']=find(r'canone (?:annuo a partire da|onnicomprensivo pari a) ([\d.,]+)',desc)
            record['included_volume_text']=find(r'consum[oi] annu[oi] fino a (\d+)',desc)or find(r'consumi fino a (\d+)',desc)
            record['excess_unit_price_text_eur']=find(r'corrispettivo al consumo (?:pari a |di a |di )([0-9]+(?:,[0-9]+)?)',desc)
            record['monthly_discount_text_eur']=find(r'(?:sconto del canone mensile di|sconto mensile sul canone di) (\d+)',desc)
            record['described_as_domestic']='clienti domestici' in desc
            record['tax_inclusion_statement_present']='accise e IVA' in desc or 'oneri generali di sistema e le imposte' in desc
            record['requires_electricity_contract']= 'già intestatari di un contratto Fastweb Energia Luce' in desc
            record['discount_requires_telecom_contract']= 'mantenere attivo un contratto Fastweb o Vodafone Italia' in desc
            record['underconsumption_settlement_described']= 'non consumato' in desc or 'inferiori rispetto' in desc
        record['selected_canone_or_rate_case']=record['vendor']=='Fastweb S.p.A.' or 'CASA MIA NO STRESS_' in (record['name']or '')
        records.append(record)
    assert len(records)==declared
    assert len({r['page_modal_id']for r in records})==declared
    return {'source':metadata(path),'official_url':'https://www.ilportaleofferte.it/portaleOfferte/it/offerte-non-confrontabili.page?commodityType='+('ELETTRICO' if supply=='E'else 'GAS'),
            'declared_count':declared,'parsed_count':len(records),'unique_page_modal_ids':declared,
            'caveat':'These are public page identifiers, not COD_OFFERTA. No structured domestic/switching eligibility fields exposed by the cards. No annual price calculation is inferred.',
            'selected_cases':[r for r in records if r['selected_canone_or_rate_case']]}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--directory',default='/tmp')
    parser.add_argument('--out',required=True)
    args=parser.parse_args();directory=pathlib.Path(args.directory)
    result={'date':'2026-10-27','method':'XML global tag scan and scoped type counts; text clues are an explicit non-exhaustive selection, not automatic tariff classification. Public page cards parsed without following supplier links.','xml':{},'noncomparable_pages':{}}
    for date in ('20261026','20261027'):
        for supply in ('E','G'):
            day=datetime.date(int(date[:4]),int(date[4:6]),int(date[6:]))
            result['xml'][date+'-'+supply]=xml_audit(directory/f'la-mia-bolletta-{date}-{supply}.xml',day)
    for supply in ('E','G'):
        result['noncomparable_pages'][supply]=html_audit(directory/f'portale-nonconfrontabili-{supply}-20261027.html',supply)
    pathlib.Path(args.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'xml_counts':{k:v['scopes']for k,v in result['xml'].items()},'noncomparable':{k:v['parsed_count']for k,v in result['noncomparable_pages'].items()}},ensure_ascii=False))
