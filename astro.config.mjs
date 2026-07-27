import { defineConfig } from 'astro/config';

// Сайт живёт по адресу https://andrewkuchik.github.io/flora-video/
// поэтому base = '/flora-video'. Ссылки и ассеты строятся от import.meta.env.BASE_URL.
export default defineConfig({
  site: 'https://andrewkuchik.github.io',
  base: '/flora-video',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
