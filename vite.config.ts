import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
// Forcing Vite dev server restart to clear graph
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 3000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://13.60.246.95',
                changeOrigin: true,
            }
        }
    },
});
