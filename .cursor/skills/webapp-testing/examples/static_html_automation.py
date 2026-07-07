from __future__ import annotations

from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright


def file_url(path: Path) -> str:
    return urljoin("file:", path.resolve().as_uri().removeprefix("file:"))


def main() -> None:
    html_path = Path("index.html")
    url = file_url(html_path)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(url)
        page.wait_for_load_state("load")

        page.screenshot(path="static_inspect.png", full_page=True)

        # Example action patterns (edit selectors to match your HTML)
        # page.get_by_role("button", name="Submit").click()
        # page.locator("#email").fill("test@example.com")

        browser.close()


if __name__ == "__main__":
    main()

