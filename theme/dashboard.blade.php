<!DOCTYPE html>
<html lang="{{ $theme_config['or_locale'] ?? 'zh-CN' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no">
    <title>{{ $title }}</title>
    {{-- Cache-busting: use file mtime so Cloudflare never serves stale assets --}}
    @php
        $appJsPath  = public_path('theme/' . $theme . '/assets/app.js');
        $buildVer   = file_exists($appJsPath) ? filemtime($appJsPath) : time();
    @endphp
    <link rel="stylesheet" href="/theme/{{ $theme }}/assets/app.css?v={{ $buildVer }}">
    {{-- Pass V2Board site config to OpenRealm --}}
    <script>
        window.__OR_CONFIG__ = {
            title: @json($title),
            logo:  @json($logo ?? ''),
            description: @json($description ?? ''),
            theme:  @json($theme_config['or_theme'] ?? 'light'),
            locale: @json($theme_config['or_locale'] ?? 'zh-CN'),
            adminPath: @json(config('v2board.secure_path', config('v2board.frontend_admin_path', 'admin'))),
        };
        // Pre-set localStorage so OpenRealm picks up theme/locale on first load
        try {
            if (!localStorage.getItem('or_theme'))  localStorage.setItem('or_theme',  window.__OR_CONFIG__.theme);
            if (!localStorage.getItem('or_locale')) localStorage.setItem('or_locale', window.__OR_CONFIG__.locale);
        } catch(e) {}
    </script>
    <script data-cfasync="false" type="module" src="/theme/{{ $theme }}/assets/app.js?v={{ $buildVer }}"></script>
</head>
<body>
    <div id="app"></div>
    {!! $theme_config['custom_html'] ?? '' !!}
</body>
</html>
