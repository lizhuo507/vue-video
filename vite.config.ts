import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import { resolve } from "path";
const timestamp = new Date().getTime()
const version = require('./src/utils/version')
version.create()
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    css: {
        postcss: {
            plugins: [tailwindcss],
        },
        // CSS 预处理器
        preprocessorOptions: {
            // 定义全局 SCSS 变量
            scss: {
                javascriptEnabled: true,
                additionalData: `
            @use "@/styles/variables.scss" as *;
          `,
            },
        },
    },
    server: {
        // host: '127.0.0.1',
        // 允许IP访问
        host: true,
        // 应用端口 (默认:3000)
        port: 3000,
        // 运行是否自动打开浏览器
        open: true,
        cors: true,
        proxy: {
            /** 代理前缀为 /api2 的请求  */
            '/api2': {
              changeOrigin: true,
              // 接口地址
              // target: 'http://10.100.13.196:8888',
              // target: 'http://10.100.13.166:8888',
              // target: 'http://10.145.150.153:8888',
              target: 'https://spsn.jtyst.zj.gov.cn:8001/api2',
              rewrite: (path) => path.replace(/^\/api2/, ''),
          },
        },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `static/[name].${timestamp}.js`,
          chunkFileNames: `static/[name].${timestamp}.js`,
          assetFileNames: `static/[name].${timestamp}.[ext]`,
        }
      },
    }
})
