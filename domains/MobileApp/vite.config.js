import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { serveLocalAssets } from '../../src/plugins/serve-local-assets.jsx'
import path from "path";


const ASSET_ORIGIN = 'https://harvestschools.com'

function rewriteRootAssetUrls() {
    const pattern = /url\((['"]?)\/(?:assets\/)?(images|videos|documents|fonts|locales)\//g
    return {
        name: 'rewrite-root-asset-urls-for-native',
        enforce: 'post',
        generateBundle(_, bundle) {
            for (const file of Object.values(bundle)) {
                if (file.type === 'asset' && file.fileName.endsWith('.css')) {
                    file.source = file.source.toString().replace(pattern, `url($1${ASSET_ORIGIN}/$2/`)
                } else if (file.type === 'chunk') {
                    file.code = file.code.replace(pattern, `url($1${ASSET_ORIGIN}/$2/`)
                }
            }
        }
    }
}

export default defineConfig({
    base: './',
    plugins: [react(), rewriteRootAssetUrls(), serveLocalAssets(path.resolve(process.cwd(), '../../assets'))],
    build: {
        emptyOutDir: true,
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
    cacheDir: '../../node_modules/.vite-app'
})