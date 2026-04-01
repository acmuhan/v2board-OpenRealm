<!DOCTYPE html>
<html lang="{{ $theme_config['or_locale'] ?? 'zh-CN' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no">
    <title>{{ $title }}</title>
    <link rel="stylesheet" href="/theme/{{ $theme }}/assets/app.css">
    {{-- Pass V2Board site config to OpenRealm --}}
    <script>
        window.__OR_CONFIG__ = {
            title: @json($title),
            logo:  @json($logo ?? ''),
            description: @json($description ?? ''),
            theme:  @json($theme_config['or_theme'] ?? 'light'),
            locale: @json($theme_config['or_locale'] ?? 'zh-CN'),
            adminPath: @json(env('APP_ADMIN_PATH', 'admin')),
        };
        // Pre-set localStorage so OpenRealm picks up theme/locale on first load
        try {
            if (!localStorage.getItem('or_theme'))  localStorage.setItem('or_theme',  window.__OR_CONFIG__.theme);
            if (!localStorage.getItem('or_locale')) localStorage.setItem('or_locale', window.__OR_CONFIG__.locale);
        } catch(e) {}
    </script>
    <script data-cfasync="false" type="module" src="/theme/{{ $theme }}/assets/app.js"></script>
</head>
<body>
    <div id="app"></div>
    {!! $theme_config['custom_html'] ?? '' !!}
</body>
</html>
