import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", // الفولدر اللي فيه التيستات
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000", // الرابط المحلي لتطبيقك
    trace: "on-first-retry",
  },

  /* تشغيل سيرفر Next.js تلقائياً قبل التيست */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // يمكنك تفعيل Firefox أو WebKit لو حابب تتأكد من التوافقية الكاملة
  ],
});
