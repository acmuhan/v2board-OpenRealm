import os, glob
from playwright.sync_api import sync_playwright

out_dir = r"C:\Users\MuHan\AppData\Local\Temp\metabot-outputs\oc_aeb8a86851d255cf80fa8ed44d1c68db"
video_dir = os.path.join(out_dir, "vtmp")
os.makedirs(video_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        record_video_dir=video_dir,
        record_video_size={"width": 1440, "height": 900},
    )
    page = context.new_page()

    # 1. Login page with animated background
    page.goto("http://localhost:3101/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)
    page.type('input[type="email"]', "demo@openrealm.com", delay=60)
    page.wait_for_timeout(300)
    page.type('input[type="password"]', "securepass", delay=40)
    page.wait_for_timeout(1000)

    # Simulate login
    page.evaluate("localStorage.setItem('or_token', 'demo')")
    page.wait_for_timeout(300)

    # 2. Dashboard - bento grid with charts
    page.goto("http://localhost:3101/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    # 3. Navigate through pages
    for path in ['/shop', '/nodes', '/traffic', '/orders', '/invite', '/tickets', '/tutorial', '/knowledge', '/settings']:
        try:
            page.click(f'a[href="{path}"]', timeout=3000)
        except:
            page.goto(f"http://localhost:3101{path}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1200)

    # 4. Back to dashboard for theme switching
    page.click('a[href="/"]')
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)

    # 5. Theme switching demo - click theme button
    try:
        page.click('.theme-toggle', timeout=2000)
        page.wait_for_timeout(800)
        # Switch to violet
        page.evaluate("document.documentElement.setAttribute('data-theme', 'violet')")
        page.wait_for_timeout(2000)
        # Switch to sunset
        page.evaluate("document.documentElement.setAttribute('data-theme', 'sunset')")
        page.wait_for_timeout(2000)
        # Switch to emerald
        page.evaluate("document.documentElement.setAttribute('data-theme', 'emerald')")
        page.wait_for_timeout(2000)
        # Back to default
        page.evaluate("document.documentElement.removeAttribute('data-theme')")
        page.wait_for_timeout(1500)
    except:
        pass

    context.close()
    browser.close()

videos = glob.glob(os.path.join(video_dir, "*.webm"))
if videos:
    final = os.path.join(out_dir, "OpenRealm_v3_Demo.webm")
    os.replace(videos[0], final)
    print(f"OK: {final}")
    try: os.rmdir(video_dir)
    except: pass
else:
    print("No video!")
