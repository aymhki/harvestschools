import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {serveLocalAssets} from "../../src/plugins/serve-local-assets.jsx";
import path from 'path'

export default defineConfig({
    envDir: path.resolve(import.meta.dirname, '../..'),
    plugins: [
        react(),
        serveLocalAssets(path.resolve(process.cwd(), '../../assets')),
    ],
    build: {
        outDir: 'dist/admin',
        emptyOutDir: true,
        rollupOptions: {
            input: 'index.html',
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor'
                    }
                }
            },
            external: (id) => id.includes('/fonts/')
        }
    },
    base: '/',
    cacheDir: '../../node_modules/.vite-admin',
})