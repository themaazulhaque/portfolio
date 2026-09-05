from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # Test 1: Contact Form
    print("=== TEST 1: CONTACT FORM ===")
    page.goto("https://maazulhaque.qd.je", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(2000)

    # Find and fill contact form
    try:
        page.scroll_into_view_if_needed("#contact")
        page.wait_for_timeout(500)
        page.fill('input[name="name"]', "Email Investigation Test")
        page.fill('input[name="email"]', "maazulhaque26@gmail.com")
        page.fill('input[name="subject"]', "Production Email Test - Contact Form")
        page.fill('textarea[name="message"]', "Testing whether acknowledgement email is sent alongside admin notification. This is an investigation test.")
        
        submit = page.locator('.contact-form button[type="submit"]')
        print(f"Contact submit button visible: {submit.is_visible()}")
        submit.click()
        page.wait_for_timeout(5000)
        
        # Check for success message
        success = page.locator('.contact-form-success, .contact-success')
        error = page.locator('.contact-form-error')
        if success.count() > 0 and success.is_visible():
            print(f"Contact form SUCCESS: {success.inner_text()}")
        elif error.count() > 0 and error.is_visible():
            print(f"Contact form ERROR: {error.inner_text()}")
        else:
            print("Contact form: no success/error message visible")
            # Check if form was cleared (often indicates success)
            name_val = page.locator('input[name="name"]').input_value()
            print(f"Name field after submit: '{name_val}' (empty = likely success)")
    except Exception as e:
        print(f"Contact form error: {e}")

    # Test 2: Review Form
    print("\n=== TEST 2: REVIEW FORM ===")
    page.goto("https://maazulhaque.qd.je", timeout=30000, wait_until="networkidle")
    page.wait_for_timeout(2000)
    
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    try:
        btn = page.get_by_role("button", name="Leave a Review")
        print(f"Review button visible: {btn.is_visible()}")
        btn.click()
        page.wait_for_timeout(2000)
        
        form = page.locator(".review-form")
        print(f"Review form visible: {form.is_visible()}")
        
        if form.is_visible():
            page.fill("#review-name", "Email Investigation Test Reviewer")
            page.fill("#review-email", "maazulhaque26@gmail.com")
            page.fill("#review-designation", "QA Investigator")
            page.fill("#review-text", "Testing whether review acknowledgement email is sent. This is an investigation test.")
            
            page.get_by_role("button", name="Submit Review").click()
            page.wait_for_timeout(8000)
            
            success = page.locator(".review-success")
            if success.is_visible():
                print(f"Review submit SUCCESS: {success.inner_text()}")
            else:
                print("Review submit: no success message visible")
        else:
            print("Review form NOT visible after click")
    except Exception as e:
        print(f"Review form error: {e}")

    if errors:
        print(f"\nPage errors: {errors}")

    browser.close()
    print("\n=== DONE - Now check Resend API for new emails ===")
