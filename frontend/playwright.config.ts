import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_DB_PATH = path.join(os.tmpdir(), 'brew-tracker-e2e.db')
const BACKEND_DIR = path.resolve(__dirname, '../backend')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Runs on 8010, not 8000, so it never collides with a real dev/Docker
      // instance of the app that's already serving the real brews.db.
      command: `rm -f "${TEST_DB_PATH}" && ${path.join(BACKEND_DIR, '.venv/bin/uvicorn')} app.main:app --port 8010`,
      cwd: BACKEND_DIR,
      url: 'http://localhost:8010/api/meta',
      reuseExistingServer: false,
      env: {
        ...process.env,
        BREW_TRACKER_DATABASE_URL: `sqlite:///${TEST_DB_PATH}`,
      },
    },
    {
      command: 'npm run dev',
      cwd: __dirname,
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      env: {
        ...process.env,
        BREW_TRACKER_API_URL: 'http://localhost:8010',
      },
    },
  ],
})
