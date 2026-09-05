from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    print("=== CONTACT FORM TEST ===")
    page.goto("https://maazulhaque.qd.je", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(2000)

    name_input = page.locator('input[name="name"]')
    name_input.scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    page.fill('input[name="name"]', "Email Investigation Test")
    page.fill('input[name="email"]', "maazulhaque26@gmail.com")
    page.fill('input[name="subject"]', "Production Email Test - Contact Form")
    page.fill('textarea[name="message"]', "Testing whether acknowledgement email is sent alongside admin notification.")

    submit = page.locator('.contact-form button[type="submit"]')
    print(f"Submit button visible: {submit.is_visible()}")
    submit.click()
    page.wait_for_timeout(5000)

    success = page.locator('.contact-success')
    error_el = page.locator('.contact-form-error')
    if success.count() > 0 and success.is_visible():
        print(f"SUCCESS: {success.inner_text()}")
    elif error_el.count() > 0 and error_el.is_visible():
        print(f"ERROR: {error_el.inner_text()}")
    else:
        print("No success/error message. Checking if form cleared...")
        name_val = page.locator('input[name="name"]').input_value()
        print(f"Name field value after submit: '{name_val}'")

    browser.close()
