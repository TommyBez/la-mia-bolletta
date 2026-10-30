#!/usr/bin/env python3
"""Inspect saved official HTML/JS; no network, supplier links or guessed endpoints."""
import collections
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = 'https://www.ilportaleofferte.it'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.modals = {}
        self.modal = None
        self.depth = 0
        self.forms = []
        self.inputs = []
        self.scripts = []
        self.links = []
        self.inline_scripts = []
        self.inline = None
        self.current_form = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'form':
            self.current_form = {'attributes': attrs, 'fields': []}
            self.forms.append(self.current_form)
        if tag in ('input', 'select', 'textarea'):
            field = {k: attrs[k] for k in ('id','name','type','value') if k in attrs}
            self.inputs.append(field)
            if self.current_form is not None: self.current_form['fields'].append(field)
        if tag == 'script':
            if attrs.get('src'): self.scripts.append(attrs['src'])
            else: self.inline = []
        if tag == 'a' and attrs.get('href'): self.links.append(attrs['href'])
        if tag == 'div' and re.fullmatch(r'modal-\d+', attrs.get('id', '')):
            assert self.modal is None
            self.modal = {'id': attrs['id'], 'tags': [], 'attrs': [], 'text': []}
            self.depth = 0
        if self.modal is not None:
            if tag == 'div': self.depth += 1
            self.modal['tags'].append(tag)
            self.modal['attrs'].append({'tag':tag, 'attrs':attrs})

    def handle_data(self, data):
        if self.modal is not None: self.modal['text'].append(data)
        if self.inline is not None: self.inline.append(data)

    def handle_endtag(self, tag):
        if tag == 'form': self.current_form = None
        if tag == 'script' and self.inline is not None:
            self.inline_scripts.append(''.join(self.inline)); self.inline = None
        if tag == 'div' and self.modal is not None:
            self.depth -= 1
            if self.depth == 0:
                self.modals[self.modal['id']] = self.modal
                self.modal = None

def sha(data): return hashlib.sha256(data).hexdigest()
def source(path, url):
    raw=path.read_bytes()
    return {'path':str(path),'url':url,'bytes':len(raw),'sha256':sha(raw)}
def parse(path):
    p=Page(); p.feed(path.read_text()); return p
def text_hash(modal): return sha(' '.join(' '.join(modal['text']).split()).encode())

def main():
    selected=json.loads(Path('docs/evidenze/canone-2026-10-27/selected-portal-descriptions.json').read_text())
    report={'date':'2026-10-27','method':'Saved public official HTML and observed first-party JS only. No supplier links followed; no endpoints guessed.','pages':{},'scripts':{},'open_data':{}}
    for supply, commodity in [('E','ELETTRICO'),('G','GAS')]:
        path=Path('/tmp/lmb-canoni-current-'+supply+'.html')
        p=parse(path)
        old=parse(Path('/tmp/portale-nonconfrontabili-'+supply+'-20261027.html'))
        tags=collections.Counter(t for m in p.modals.values() for t in m['tags'])
        sample=[]
        for record in selected[supply]['records']:
            mid=record['page_modal_id']; modal=p.modals[mid]
            assert text_hash(modal)==text_hash(old.modals[mid])
            sample.append({'id':mid,'name':record['name'],'same_modal_text_as_previous_acquisition':True,
                           'text_sha256':text_hash(modal),'tags':dict(collections.Counter(modal['tags'])),
                           'all_attributes':modal['attrs']})
        report['pages'][supply]={'source':source(path,ROOT+'/portaleOfferte/it/offerte-non-confrontabili.page?commodityType='+commodity),
          'modal_count':len(p.modals),'all_modal_tag_counts':dict(tags),'forms':p.forms,'scripts':p.scripts,
          'inline_script_count':len(p.inline_scripts),'selected_modals':sample,
          'structured_json_scripts':len(re.findall(r'application/(?:ld\+)?json',path.read_text())),
          'price_profile_named_fields': [x for x in p.inputs if re.search(r'canone|prezzo|price|durata|codOfferta|codiceOfferta|consumo|potenza|iva',json.dumps(x),re.I)]}
    for name in ['filtriAvanzati','confrontaOfferte','mainCommon']:
        path=Path('/tmp/lmb-canoni-'+name+'.js')
        lines=path.read_text().splitlines()
        report['scripts'][name]={'source':source(path,ROOT+'/portaleOfferte/resources/static/js/'+name+'.js'),
           'observed_service_lines':[{'line':i+1,'text':s.strip()}for i,s in enumerate(lines)if '/api/'in s],
           'non_sii_function_lines':[{'line':i+1,'text':s.strip()}for i,s in enumerate(lines)if re.search(r'NotSII|NoSII',s)]}
    path=Path('/tmp/lmb-canoni-open-data.html');p=parse(path)
    report['open_data']={'source':source(path,ROOT+'/portaleOfferte/it/open-data.page'),
       'download_links':[ROOT+x if x.startswith('/')else x for x in p.links if re.search(r'\.(?:csv|xml|zip|xlsx?)(?:\?|$)',x,re.I)]}
    path=Path('/tmp/lmb-canoni-site-search.html')
    assert 'Nessun risultato trovato' in path.read_text()
    report['site_search']={'source':source(path,ROOT+'/portaleOfferte/it/cerca-nel-sito.page?search=Fastweb%20Luce%20Flat%20Light'),
        'query':'Fastweb Luce Flat Light','observed_message':'Nessun risultato trovato',
        'caveat':'The CMS search is not proven to index all catalog offers. This negative result is not proof of global absence.'}
    out=Path('docs/evidenze/canone-2026-10-27/public-discovery/inspection.json')
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'modal_counts':{k:v['modal_count']for k,v in report['pages'].items()},
                      'download_count':len(report['open_data']['download_links']),
                      'selected_modals_unchanged':sum(len(x['selected_modals'])for x in report['pages'].values())}))

if __name__ == '__main__': main()
