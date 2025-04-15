import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Interview",
  description: "A Interview Question Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' }
    ],

    sidebar: {
      "/": [
        {
          text: 'Golang',
          collapsed: true,
          items: [
            { text: 'GMP', link: '/list/go/gmp' },
            { text: '顺序执行 goroutine', link: '/list/go/alternate_print' },
            { text: '发布订阅', link: '/list/go/pub_sub' },
          ]
        },
        {
          text: 'MySQL',
          collapsed: true,
          items: [
            { text: '索引', link: '/list/mysql/index' },
          ]
        },
        {
          text: 'Kafka',
          collapsed: true,
          items: [
            { text: '基本概念', link: '/list/kafka/base' },
          ]
        },
        {
          text: 'Redis',
          collapsed: true,
          items: [
            { text: '基本数据类型', link: '/list/redis/base' },
          ]
        }
      ],
    },

    vite: {
      server: {
        hmr: true
      }
    }
  }
})
