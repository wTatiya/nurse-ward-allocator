from __future__ import annotations

import json
from playwright.sync_api import sync_playwright


def main() -> None:
    url = "http://localhost:5173"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(url)
        page.wait_for_load_state("networkidle")

        page.screenshot(path="inspect.png", full_page=True)

        buttons = page.locator("button").all()
        links = page.locator("a").all()
        inputs = page.locator("input, textarea, [contenteditable='true']").all()

        def summarize(locator_list):
            out = []
            for el in locator_list[:50]:
                try:
                    out.append(
                        {
                            "tag": el.evaluate("e => e.tagName.toLowerCase()"),
                            "text": (el.inner_text() or "").strip()[:120],
                            "id": el.get_attribute("id"),
                            "name": el.get_attribute("name"),
                            "type": el.get_attribute("type"),
                            "aria_label": el.get_attribute("aria-label"),
                            "placeholder": el.get_attribute("placeholder"),
                        }
                    )
                except Exception:
                    continue
            return out

        summary = {
            "url": url,
            "buttons": summarize(buttons),
            "links": summarize(links),
            "inputs": summarize(inputs),
        }

        with open("element_summary.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        browser.close()


if __name__ == "__main__":
    main()

