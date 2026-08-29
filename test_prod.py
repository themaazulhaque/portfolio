import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        # Production: client-side navigation
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(1)

        result = await page.evaluate("""async () => {
            const btn = document.querySelector('.p-view');
            if (!btn) return { error: 'no button' };
            btn.click();
            await new Promise(r => setTimeout(r, 4000));
            return { url: window.location.href, hasCaseStudy: !!document.querySelector('.cs-intro-title') };
        }""")
        print(f"Client nav: {result}")
        print(f"Errors: {errors}")

        errors.clear()
        await page.goto("http://localhost:3000/work/halalpizzafun", wait_until="networkidle", timeout=30000)
        has = await page.evaluate("() => !!document.querySelector('.cs-intro-title')")
        print(f"Direct nav: has content={has}, errors={errors}")

        await browser.close()

asyncio.run(main())
