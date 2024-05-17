import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import { resolve } from "path";

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
            /** 代理前缀为 /api 的请求  */
            '/api': {
                changeOrigin: true,
                // 接口地址
                target: 'http://10.100.13.196:8888',
                // target: 'http://10.100.13.166:8888',
                // target: 'http://10.145.150.153:8888',
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    build: {
      target: 'modules',
      assetsDir: 'static',
    }
})
