import { defineConfig } from 'astro/config';

// Переезд на Vercel: сайт живёт в корне (base '/'), а не в /flora-video.
// Vercel сам определяет Astro: build = `astro build`, вывод — dist/.
// Ссылки и ассеты строятся от import.meta.env.BASE_URL (теперь '/').
export default defineConfig({
  site: 'https://flora-video.vercel.app',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
