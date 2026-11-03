import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Load test.env if present during testing
  let testEnv = {};
  const testEnvPath = path.resolve(process.cwd(), 'test.env');
  if (fs.existsSync(testEnvPath)) {
    const lines = fs.readFileSync(testEnvPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        testEnv[match[1].trim()] = match[2].trim();
      }
    }
  }

  const devPort = env.VITE_DEV_PORT
    ? parseInt(env.VITE_DEV_PORT, 10)
    : testEnv.VITE_DEV_PORT
      ? parseInt(testEnv.VITE_DEV_PORT, 10)
      : 5173;

  // Fail build immediately if VITE_API_URL is missing
  if (command === 'build' && !env.VITE_API_URL) {
    throw new Error('❌ Build failed: VITE_API_URL is required in client environment variables.');
  }

  // Reject port 5000 if configured
  if (devPort === 5000) {
    throw new Error('❌ Port 5000 is prohibited on macOS due to AirPlay Receiver collisions. Use VITE_DEV_PORT=5173.');
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: devPort,
      strictPort: true,
      host: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/.{idea,git,cache,output,temp}/**'],
      env: {
        VITE_API_URL: testEnv.VITE_API_URL || env.VITE_API_URL || process.env.VITE_API_URL,
        VITE_DEV_PORT: String(devPort),
      },
    },
  };
});
