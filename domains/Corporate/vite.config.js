import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { serveLocalAssets } from '../../src/plugins/serve-local-assets.jsx'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        serveLocalAssets(path.resolve(process.cwd(), '../../assets'))
    ],
    ssr: {
        noExternal: ['react-helmet-async'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'vendor-react';
                    }

                    if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfmake')) {
                        return 'vendor-pdf';
                    }
                }
            },
            external: (id) => id.includes('/fonts/')
        }
    },
    cacheDir: '../../node_modules/.vite-corporate',
})
