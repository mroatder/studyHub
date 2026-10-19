import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxtjs/color-mode', '@nuxtjs/supabase'],

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

  // เว็บส่วนตัว: ล็อกอินก่อนเข้าทุกหน้า (ตั้งค่าเต็มในขั้นที่ 2)
  supabase: {
    redirect: false,
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
