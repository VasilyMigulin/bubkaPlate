import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 420, height: 900 } });
await page.goto('http://localhost:5188/', { waitUntil: 'networkidle' });
// пройти онбординг, если он есть
try {
  const name = page.locator('.onb-input').first();
  if (await name.isVisible({ timeout: 1500 })) {
    await name.fill('Миша');
    await page.getByText('Дальше').click();
    await page.locator('input[type=date]').fill('2025-12-24');
    await page.getByText('Дальше').click();
    await page.getByText(/Начать/).click();
  }
} catch {}
// в каталог
await page.getByText('Каталог', { exact: false }).last().click();
await page.waitForTimeout(600);
// открыть арахис
await page.getByText('Арахис', { exact: false }).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: process.env.SCR + '/card-top.png' });
await b.close();
