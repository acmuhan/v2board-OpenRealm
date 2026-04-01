<!DOCTYPE html>
<html lang="{{ $theme_config['or_locale'] ?? 'zh-CN' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no">
    <title>{{ $title }}</title>
    @php
        // Read Vite manifest to resolve hashed asset filenames
        $manifestPath = public_path("theme/{$theme}/.vite/manifest.json");
        $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
        $entry = null;
        foreach ($manifest as $item) {
            if (!empty($item['isEntry'])) {
                $entry = $item;
                break;
            }
        }
    @endphp
    {{-- CSS --}}
    @if($entry)
        @foreach($entry['css'] ?? [] as $cssFile)
            <link rel="stylesheet" href="/theme/{{ $theme }}/{{ $cssFile }}">
        @endforeach
    @endif
    {{-- Pass V2Board site config to OpenRealm --}}
    <script>
        window.__OR_CONFIG__ = {
            title: @json($title),
            logo:  @json($logo ?? ''),
            description: @json($description ?? ''),
            theme:  @json($theme_config['or_theme'] ?? 'light'),
            locale: @json($theme_config['or_locale'] ?? 'zh-CN'),
        };
        // Pre-set localStorage so OpenRealm picks up theme/locale on first load
        try {
            if (!localStorage.getItem('or_theme'))  localStorage.setItem('or_theme',  window.__OR_CONFIG__.theme);
            if (!localStorage.getItem('or_locale')) localStorage.setItem('or_locale', window.__OR_CONFIG__.locale);
        } catch(e) {}
    </script>
    {{-- JS entry --}}
    @if($entry)
        <script type="module" src="/theme/{{ $theme }}/{{ $entry['file'] }}"></script>
    @endif
</head>
<body>
    <div id="app"></div>
    {!! $theme_config['custom_html'] ?? '' !!}
</body>
</html>
