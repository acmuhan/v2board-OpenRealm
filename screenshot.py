import os
from playwright.sync_api import sync_playwright

out_dir = r"C:\Users\MuHan\AppData\Local\Temp\metabot-outputs\oc_aeb8a86851d255cf80fa8ed44d1c68db"
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Login page
    page.goto('http://localhost:3101/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(out_dir, "v3_login.png"))
    print("Login OK")

    # Set token for auth pages
    page.evaluate("localStorage.setItem('or_token', 'demo')")

    # Dashboard
    page.goto('http://localhost:3101/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(out_dir, "v3_dashboard.png"))
    print("Dashboard OK")

    # Shop
    page.goto('http://localhost:3101/shop')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(out_dir, "v3_shop.png"))
    print("Shop OK")

    # Nodes
    page.goto('http://localhost:3101/nodes')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(out_dir, "v3_nodes.png"))
    print("Nodes OK")

    # Traffic
    page.goto('http://localhost:3101/traffic')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(out_dir, "v3_traffic.png"))
    print("Traffic OK")

    # Test theme switching - switch to violet theme
    page.goto('http://localhost:3101/')
    page.wait_for_load_state('networkidle')
    page.evaluate("document.documentElement.setAttribute('data-theme', 'violet')")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(out_dir, "v3_theme_violet.png"))
    print("Violet theme OK")

    # Sunset theme
    page.evaluate("document.documentElement.setAttribute('data-theme', 'sunset')")
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(out_dir, "v3_theme_sunset.png"))
    print("Sunset theme OK")

    browser.close()
