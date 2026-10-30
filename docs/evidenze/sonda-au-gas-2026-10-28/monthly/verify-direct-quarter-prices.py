"""No network; verify four gas quarter probes and two preregistered holdouts."""
from pathlib import Path
from decimal import Decimal as D
import json

here = Path(__file__).parent
zero = "000971GSVML01XXPROD1300109202600"
other = "029886GSVML01XXSENZAPENSIDOMGAS3"
quarter_months = [("202512", "Q4"), ("202602", "Q1"), ("202605", "Q2"), ("202608", "Q3")]


def load(month, code, kind):
    value = json.loads((here / month / f"{code}-1200-RISC-type{kind}.json").read_text())
    profile = value["profile"]
    assert profile["usaConsumi"] == "SI" and profile["statoMisure"] == "3"
    assert profile["consumoTotale"] == 1200 and profile["consumoGAS"] == 1200
    measurements = profile["misure_mensili"]
    assert len(measurements) == 12
    assert sum(D(str(item["delta_misure_gas"])) for item in measurements) == 1200
    sale = D(value["sale"].replace(".", "").replace(",", "."))
    return value, measurements, sale


result = {"method": "Direct sale with synthetic monthly weights, no IVA model", "calibration": [], "holdouts": []}
prices = {}
for month, quarter in quarter_months:
    value, measurements, sale = load(month, zero, "02")
    assert next(item for item in measurements if item["competenza_consumi"] == month)["delta_misure_gas"] == 1200
    price = (sale - 174) / 1200
    prices[quarter] = price
    result["calibration"].append({"input_month": month, "quarter_group": quarter, "sale_eur": str(sale), "implied_eur_smc": str(price), "rounding_interval_eur_smc": [str((sale - D(".005") - 174) / 1200), str((sale + D(".005") - 174) / 1200)]})

prediction = json.loads((here / "predictions-before-holdout.json").read_text())
expected_months = prediction["holdout_months"]
expected = 174 + sum(prices[q] * D(expected_months[m]) for m, q in quarter_months)
assert expected == D(prediction["ZERO_sale_prediction"])
for code, kind, fixed, spread, pred_key in [(zero, "02", D(174), D(0), "ZERO_sale_prediction"), (other, "03", D(144), D(".08"), "S_sale_prediction")]:
    value, measurements, sale = load("holdout", code, kind)
    for item in measurements:
        assert D(str(item["delta_misure_gas"])) == D(expected_months.get(item["competenza_consumi"], 0))
    predicted = expected - 174 + fixed + spread * 1200
    assert predicted == D(prediction[pred_key])
    assert abs(predicted - sale) <= D(".01")
    result["holdouts"].append({"code": code, "prediction_unrounded_eur": str(predicted), "observed_eur": str(sale), "residual_eur": str(sale - predicted), "compatible": True})

result["design_matrix_rank"] = 4
result["design_matrix"] = [[1200 if i == j else 0 for j in range(4)] for i in range(4)]
(here / "direct-quarter-results.json").write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
