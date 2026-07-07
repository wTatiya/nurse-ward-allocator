---
name: webapp-testing
description: Tests local web applications using native Python Playwright scripts (Chromium headless) with a reconnaissance-then-action workflow. Use when the user asks to test a web app locally, write E2E/UI automation, interact with localhost apps, take DOM screenshots, capture console logs, or mentions Playwright, selectors, networkidle, or scripts/with_server.py.
---

# Web Application Testing (Local)

To test local web applications, write native **Python Playwright** scripts.

## Default approach

- Use **sync Playwright**
- Launch **Chromium headless**
- For dynamic apps, **wait for `networkidle` before inspecting DOM**

## Helper scripts

- `scripts/with_server.py` manages server lifecycle (supports multiple servers)
- **Always run helper scripts with `--help` first** (treat as a black box)
- **Do not read helper source** unless running it fails and customization is absolutely necessary

## Decision tree (choose approach)

User task → Is it static HTML?

- **Yes (static HTML)**
  - Read the HTML file directly to identify selectors
  - Write Playwright script using those selectors (use `file://` URLs)
  - If selectors are insufficient, treat as dynamic

- **No (dynamic webapp)**
  - Is the server already running?
    - **No**
      - Run:
        - `python scripts/with_server.py --help`
      - Then wrap your Playwright script with `with_server.py`
    - **Yes**
      - Reconnaissance-then-action:
        - Navigate and wait for `networkidle`
        - Screenshot or inspect rendered DOM
        - Identify selectors from rendered state
        - Execute actions using discovered selectors

## Using `with_server.py`

Run `--help` first:

```bash
python scripts/with_server.py --help
```

Single server:

```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

Multiple servers (backend + frontend):

```bash
python scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python your_automation.py
```

## Playwright skeleton (dynamic app)

Use only Playwright logic in the automation script (servers managed externally):

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    # ... automation logic ...
    browser.close()
```

## Reconnaissance-then-action (recommended)

1. **Inspect rendered DOM (after `networkidle`)**
   - `page.screenshot(path="inspect.png", full_page=True)`
   - `content = page.content()`
   - `page.locator("button").all()`

2. **Identify selectors** from inspection results

3. **Execute actions** using discovered selectors

## Best practices

- Prefer **role/text selectors** when possible (`get_by_role`, `get_by_text`)
- Use stable CSS selectors only when needed (IDs/data attributes)
- Add explicit waits when interacting:
  - `page.wait_for_selector(...)`
  - `locator.wait_for(...)`
- Always close the browser

## Common pitfall

- ❌ Inspecting DOM before `networkidle` on dynamic apps
- ✅ `page.wait_for_load_state("networkidle")` before inspection

## Reference files

Examples showing common patterns:
- `examples/element_discovery.py`
- `examples/static_html_automation.py`
- `examples/console_logging.py`

