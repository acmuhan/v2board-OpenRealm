"""
OpenRealm UI Test - comprehensive screenshots
Uses SPA-aware navigation (pushState) to avoid server restarts.
"""
import os, time
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:3000'
OUT  = 'screenshots/test_run'
os.makedirs(OUT, exist_ok=True)

def shot(page, name, full=True):
    path = f'{OUT}/{name}.png'
    page.screenshot(path=path, full_page=full)
    print(f'  [ok] {path}')

def hard_goto(page, url):
    """Full navigation (only for root load)"""
    page.goto(url, timeout=15000)
    page.wait_for_load_state('domcontentloaded', timeout=10000)
    time.sleep(0.8)

def spa_goto(page, path):
    """Navigate within the loaded SPA without a full reload."""
    page.evaluate(f"""() => {{
        window.history.pushState(null, '', '{path}');
        window.dispatchEvent(new PopStateEvent('popstate'));
    }}""")
    time.sleep(0.7)

def inject_auth(page):
    page.evaluate("""() => {
        localStorage.setItem('or_token', 'screenshot-token');
        localStorage.setItem('or_is_admin', '1');
    }""")

def set_theme(page, t):
    page.evaluate(f"localStorage.setItem('or_theme','{t}')")
    # Reload to apply theme
    page.evaluate("""() => {
        const t = localStorage.getItem('or_theme') || 'default';
        document.documentElement.setAttribute('data-theme', t);
    }""")
    time.sleep(0.3)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ── Desktop 1280x800 ───────────────────────────────────
    print('\n-- Desktop 1280x800 --')
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()

    # Load root once
    hard_goto(page, f'{BASE}/login')
    shot(page, '01_login_desktop')

    spa_goto(page, '/register')
    shot(page, '02_register_desktop')

    # Inject auth, reload root to apply
    spa_goto(page, '/login')
    inject_auth(page)
    hard_goto(page, f'{BASE}/')
    shot(page, '03_dashboard_desktop')

    # SPA navigate to user pages
    for path, name in [
        ('/shop',    '04_shop_desktop'),
        ('/nodes',   '05_nodes_desktop'),
        ('/tickets', '06_tickets_desktop'),
        ('/profile', '07_profile_desktop'),
        ('/invite',  '08_invite_desktop'),
    ]:
        spa_goto(page, path)
        shot(page, name)

    # Theme showcase
    for theme, name in [
        ('midnight', '09a_theme_midnight'),
        ('neon',     '09b_theme_neon'),
        ('aurora',   '09c_theme_aurora'),
        ('sakura',   '09d_theme_sakura'),
        ('ocean',    '09e_theme_ocean'),
        ('gold',     '09f_theme_gold'),
        ('forest',   '09g_theme_forest'),
        ('crimson',  '09h_theme_crimson'),
    ]:
        set_theme(page, theme)
        spa_goto(page, '/')
        shot(page, name)

    set_theme(page, 'default')
    spa_goto(page, '/')

    # Admin pages (SPA navigate)
    for path, name in [
        ('/admin',                '10_admin_dashboard'),
        ('/admin/servers',        '11_admin_servers'),
        ('/admin/server-groups',  '12_admin_groups'),
        ('/admin/server-routes',  '13_admin_routes'),
        ('/admin/users',          '14_admin_users'),
        ('/admin/plans',          '15_admin_plans'),
        ('/admin/payment',        '16_admin_payment'),
        ('/admin/coupons',        '17_admin_coupons'),
        ('/admin/notices',        '18_admin_notices'),
        ('/admin/system',         '19_admin_system'),
        ('/admin/theme',          '20_admin_theme'),
    ]:
        spa_goto(page, path)
        shot(page, name)

    # ── Mobile 390x844 ─────────────────────────────────────
    # Reuse the same page (no new HTTP connection to Vite)
    print('\n-- Mobile 390x844 --')
    page.set_viewport_size({'width': 390, 'height': 844})

    # Login page (clear auth first so we see the login screen)
    spa_goto(page, '/login')
    shot(page, '21_login_mobile')

    # Dashboard (auth already in localStorage from earlier)
    spa_goto(page, '/')
    shot(page, '22_dashboard_mobile')

    for path, name in [
        ('/shop',  '23_shop_mobile'),
        ('/nodes', '24_nodes_mobile'),
    ]:
        spa_goto(page, path)
        shot(page, name)

    # Admin on mobile
    spa_goto(page, '/admin')
    shot(page, '25_admin_mobile')

    # Open hamburger menu
    try:
        page.locator('.hamburger-btn').first.click()
        time.sleep(0.5)
        shot(page, '26_admin_mobile_sidebar')
    except Exception:
        pass

    # Theme on mobile
    set_theme(page, 'midnight')
    spa_goto(page, '/')
    shot(page, '27_midnight_mobile')

    set_theme(page, 'sakura')
    spa_goto(page, '/')
    shot(page, '28_sakura_mobile')

    ctx.close()
    browser.close()

print(f'\nAll screenshots saved to {OUT}/')
