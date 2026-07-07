# Scoring Rubric

**Formula:** weighted average of dimension scores (Security 30%, Architecture 25%, Robustness 25%, Maintainability 20%).

## Dimension scoring

Start each dimension at **100**. Subtract:

| Deduction | Points |
| --- | --- |
| P0 finding in dimension | −25 each (cap −100) |
| P1 finding | −10 each |
| P2 finding | −3 each |

## Overall readiness bands

| Score | Label |
| --- | --- |
| 85–100 | **Ship** — minor hardening only |
| 65–84 | **Fix first** — P1s before production |
| 0–64 | **Not production-ready** — P0 or systemic debt |

## Severity guide

| Level | Criteria |
| --- | --- |
| P0 | Exploitable or data-loss path without auth/check |
| P1 | Likely failure in production or clear layer violation |
| P2 | Style, logging, missing test, doc drift |

Cap total P0 count in summary — if >3 P0, overall label cannot exceed **Fix first**.
