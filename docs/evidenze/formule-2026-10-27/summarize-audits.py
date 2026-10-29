#!/usr/bin/env python3
"""Compact research evidence from the two descriptive audits; no tariff engine."""
import argparse
import collections
import csv
import json
from pathlib import Path


def summarize(electricity, gas, destination):
    destination.mkdir(parents=True, exist_ok=True)
    result = {}
    rows = []
    shared = {
        'fisso': ('fixed', 'fixed'),
        'variabile': ('variable', 'variable'),
        'misto': ('mixed', 'mixed'),
        'flat': ('flat', 'flat'),
        'fasce': ('time_bands', None),
        'sconto': ('discount_any', 'discount_any'),
        'sconto_percentuale': ('discount_percent', 'discount_percent_any'),
        'sconto_a_scaglioni': ('discount_consumption_tiers', 'discount_tier'),
        'prezzo_a_scaglioni_standard': ('standard_price_consumption_tiers', 'commercial_tiers_standard'),
        'periodo_prezzo_standard': ('standard_price_period', 'price_period_standard'),
        'periodo_sconto': ('discount_period', 'discount_period'),
        'opzionale': ('optional_component', 'optional_component'),
        'onnicomprensiva': ('all_inclusive', 'all_inclusive'),
        'canone': ('all_inclusive_canone', 'canone'),
    }
    for idx, (supply, data) in enumerate([('E', electricity), ('G', gas)]):
        stats = data['summaries'] if idx == 0 else data['stats']
        compact = {}
        for scope, values in stats.items():
            compact[scope] = {
                key: value for key, value in values.items() if key != 'flags'
            }
            compact[scope]['flags'] = {
                key: {'offers': value['offers'], 'suppliers': value['suppliers']}
                for key, value in values['flags'].items()
            }
        result[supply] = {
            'source': data['source'],
            'sha256': data['source']['sha256'] if idx == 0 else data['sha256'],
            'scopes': compact,
        }
        combinations = collections.Counter()
        for offer in data['offers']:
            if idx == 1 and not offer['domestic']:
                continue
            groups = '|'.join(
                label for label, keys in shared.items()
                if keys[idx] and offer['flags'][keys[idx]]
            )
            if offer['in_scope']:
                combinations[groups] += 1
            rows.append({
                'supply': supply, 'code': offer['code'],
                'supplier_vat': offer['supplier_vat'], 'name': offer['name'],
                'single': offer['single'], 'switching': offer['switching'],
                'in_scope': offer['in_scope'], 'offer_type': offer['offer_type'],
                'groups': groups,
            })
        result[supply]['overlapping_feature_combinations_in_scope'] = dict(combinations.most_common())
    (destination / 'summary.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    with (destination / 'classification.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps({'classified_domestic_offers': len(rows), 'output': str(destination)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('electricity_json')
    parser.add_argument('gas_json')
    parser.add_argument('--out-dir', required=True)
    args = parser.parse_args()
    summarize(json.loads(Path(args.electricity_json).read_text()),
              json.loads(Path(args.gas_json).read_text()), Path(args.out_dir))
