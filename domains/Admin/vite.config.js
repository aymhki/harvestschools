import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {serveLocalAssets} from "../../vite-plugins/serve-local-assets.jsx";
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        serveLocalAssets(path.resolve(process.cwd(), '../../assets')),
    ],
    ssr: {
        noExternal: ['react-helmet-async'],
    },
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
            }
        }
    },
    base: '/',
    cacheDir: '../../node_modules/.vite-admin',
})