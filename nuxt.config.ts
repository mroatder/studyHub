import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // TODO ขั้นที่ 2: เพิ่ม '@nuxtjs/supabase' กลับเมื่อมี key
  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxtjs/color-mode'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  fonts: {
    defaults: { subsets: ['thai', 'latin', 'latin-ext'], weights: [400, 500, 600, 700] },
    families: [{ name: 'IBM Plex Sans Thai', provider: 'google' }],
    providers: { bunny: false, fontshare: false, fontsource: false },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'Study Hub',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    },
  },
})
