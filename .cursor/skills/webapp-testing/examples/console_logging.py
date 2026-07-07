from __future__ import annotations

from playwright.sync_api import sync_playwright


def main() -> None:
    url = "http://localhost:5173"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        def on_console(msg):
            try:
                location = msg.location
                loc = f"{location.get('url','')}:{location.get('lineNumber','')}:{location.get('columnNumber','')}"
            except Exception:
                loc = ""
            print(f"[console:{msg.type}] {msg.text} {loc}".rstrip())

        def on_page_error(err):
            print(f"[pageerror] {err}")

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        page.goto(url)
        page.wait_for_load_state("networkidle")

        page.screenshot(path="console_inspect.png", full_page=True)

        browser.close()


if __name__ == "__main__":
    main()

