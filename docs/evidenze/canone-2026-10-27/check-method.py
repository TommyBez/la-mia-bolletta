#!/usr/bin/env python3
"""Bounded arithmetic checks for the official canone method, not a pricing engine.

Uses only the saved Portal descriptions and official EE tax parameters. No HTTP.
The electricity case explicitly assumes the displayed minimum is applicable;
it is not an unconditional estimate for the commercial product.
"""
from decimal import Decimal, getcontext
import csv
import hashlib
import json
from pathlib import Path

getcontext().prec = 35
D = Decimal
BASE = Path(__file__).resolve().parent
data_path = BASE / 'selected-portal-descriptions.json'
data = json.loads(data_path.read_text())
params_path = Path('/tmp/la-mia-bolletta-20261026-parametri-E.csv')
with params_path.open() as f:
    params = {r['nome_parametro']: D(r['valore']) for r in csv.DictReader(f)}
vat = params['iva_c']
assert vat == D('0.10')
light = next(r for r in data['E']['records'] if r['page_modal_id'] == 'modal-14146')
assert '768€/anno' in light['description_from_portal']
assert '0,28€/kWh' in light['description_from_portal']

# Domestic resident <=3kW, both Q and Qref <=1800kWh: excise is zero,
# per annual-expense rules v4.2, section 3.1.6.1. p follows CCC 5.1(a).
gross, qref, q, p = D('768'), D('1500'), D('1400'), D('0.28')
cnet = gross / (1 + vat)
total = (cnet + p * (q-qref)) * (1+vat)
assert total.quantize(D('.01')) == D('737.20')
assert (cnet * (1+vat)).quantize(D('.01')) == gross

gas_points = []
for r in data['G']['records']:
    annual = D(r['annual_fee_text_eur'].replace('.', '').replace(',', '.'))
    volume = D(r['included_volume_text'])
    assert r['tax_inclusion_statement_present']
    # At the reference volume, any p*(Q-Qref) term vanishes. Discount
    # is conditional and excluded from the Portal-style baseline.
    gas_points.append({
        'page_modal_id': r['page_modal_id'], 'name': r['name'],
        'consumption_smc': str(volume),
        'annual_gross_before_conditional_discount_eur': str(annual),
        'conditional_contractual_arithmetic_12_months_eur': str(annual-D('120')),
        'discount_caveat': '12 eligible months; not the unconditioned Portal baseline',
    })

# Portal UI observations, same synthetic profile Milano/domestic/<G6:
# annual excise 36.78 at 300 Smc, 45.53 at 350 Smc; regional surcharge 0.
# Both volumes are below the 480 Smc VAT threshold. The unknown division
# of the fixed fee into VAT bases cancels after anchoring at the gross fee.
gas_gross, gas_r, gas_q, gas_p = D('660'), D('300'), D('350'), D('1.50')
gas_tax_path = BASE / 'public-discovery/gas-tax-ui-cases.json'
gas_tax_data = json.loads(gas_tax_path.read_text())
gas_tax_cases = {r['annual_consumption_smc']: r for r in gas_tax_data['cases']}
assert gas_tax_data['profile']['istat'] == '015146'
gas_a_r = D(gas_tax_cases[300]['observed_totals_eur']['Imposte'])
gas_a_q = D(gas_tax_cases[350]['observed_totals_eur']['Imposte'])
assert (gas_a_r, gas_a_q) == (D('36.78'), D('45.53'))
for volume in (300, 350):
    regional = [r for r in gas_tax_cases[volume]['tax_rows_dom'] if 'Add. reg.' in r[1]]
    assert len(regional) == 2 and all(D(r[2].replace(',', '.')) == 0 for r in regional)
gas_vat = D('0.10')
gas_total = gas_gross + (1+gas_vat)*(gas_p*(gas_q-gas_r)+gas_a_q-gas_a_r)
assert gas_total == D('752.1250')

# A bounded non-identifiability illustration, not two endorsed algorithms:
# two allocations of the unknown net fee share exactly the observed gross
# fee at R, but allocate the variable base differently after crossing 480.
q_cross, vat_fixed = D('500'), D('0.22')
gross_tax_r = gas_a_r*(1+gas_vat)
fee_a = (gas_gross-gross_tax_r)/(1+vat_fixed)
residual_b = (gas_gross-gross_tax_r-gas_p*gas_r*(1+gas_vat))/(1+vat_fixed)
vat_factor_q = (D('480')*(1+gas_vat)+(q_cross-D('480'))*(1+vat_fixed))/q_cross
commercial_a = fee_a*(1+vat_fixed)+gas_p*(q_cross-gas_r)*vat_factor_q
commercial_b = residual_b*(1+vat_fixed)+gas_p*(D('480')*(1+gas_vat)+(q_cross-D('480'))*(1+vat_fixed))
assert commercial_b-commercial_a == D('2.1600000000000000000000000000000')
result = {
    'source_descriptions_sha256': hashlib.sha256(data_path.read_bytes()).hexdigest(),
    'electricity_parameter_file': str(params_path),
    'electricity_parameter_sha256': hashlib.sha256(params_path.read_bytes()).hexdigest(),
    'gas_tax_evidence_file': str(gas_tax_path.relative_to(BASE)),
    'gas_tax_evidence_sha256': hashlib.sha256(gas_tax_path.read_bytes()).hexdigest(),
    'electricity_conditional_method_check': {
        'page_modal_id': light['page_modal_id'], 'gross_fee_eur': str(gross),
        'reference_kwh': str(qref), 'consumption_kwh': str(q),
        'vat_rate': str(vat), 'excise_eur': '0', 'net_unit_price_eur_kwh': str(p),
        'derived_net_fee_eur_unrounded': str(cnet),
        'annual_gross_before_conditional_discount_eur': str(total.quantize(D('.01'))),
        'assumptions': [
            'The stated starting fee 768 EUR applies to this profile; not established by the card.',
            'Domestic resident, power <=3kW; annual consumption and reference both <=1800kWh.',
            'Unit settlement price treated net of taxes under CCC 5.1(a); fee explicitly gross.',
            'Conditional discount excluded, per Portal annual-expense rules.',
        ],
        'status': 'Conditional proof of arithmetic and tax normalization, not a quote',
    },
    'gas_reference_points': gas_points,
    'gas_same_vat_band_method_check': {
        'page_modal_id': 'modal-14155', 'name': 'Fastweb Gas Flat Light',
        'gross_reference_fee_eur': str(gas_gross), 'reference_smc': str(gas_r),
        'consumption_smc': str(gas_q), 'net_settlement_price_eur_smc': str(gas_p),
        'observed_excise_reference_eur': str(gas_a_r), 'observed_excise_consumption_eur': str(gas_a_q),
        'observed_regional_surcharge_eur': '0', 'marginal_vat': str(gas_vat),
        'gross_total_unrounded_eur': str(gas_total),
        'gross_total_rounded_eur': str(gas_total.quantize(D('.01'), rounding='ROUND_HALF_UP')),
        'profile': 'Milano, domestic, meter <G6; 12 months; conditional discount excluded',
        'scope': 'Calculation for the described contract; not proof of eligibility for subscription at 350 Smc',
        'tax_source': 'Official Portal comparison detail for APIU GAS SICURO24CASA, 300 and 350 Smc, captured 2026-10-27',
    },
    'gas_cross_vat_allocation_illustration': {
        'reference_smc': str(gas_r), 'consumption_smc': str(q_cross),
        'anchored_gross_reference_fee_eur': str(gas_gross),
        'model_a': 'Annual fee at22%; settlement p*(Q-R) apportioned over all Q consumption',
        'model_b': 'Residual annual fee at22%; p*Q allocated progressively over VAT consumption bands',
        'model_a_commercial_gross_excluding_common_consumption_taxes_eur': str(commercial_a),
        'model_b_commercial_gross_excluding_common_consumption_taxes_eur': str(commercial_b),
        'difference_eur': str(commercial_b-commercial_a),
        'caveat': 'Illustrates an unspecified tax-base allocation; neither is claimed to be the Portal implementation or an actual offer price. Excise/additional-tax term at Q is identical and omitted from both.',
    },
}
print(json.dumps(result, ensure_ascii=False, indent=2))
