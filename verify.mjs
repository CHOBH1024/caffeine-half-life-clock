import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();

async function run(viewport, tag) {
  const page = await browser.newPage({ viewport });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[${tag}] ${msg.text()}`); });
  page.on('pageerror', err => errors.push(`[${tag}] pageerror: ${err.message}`));

  await page.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=카페인 섭취 입력');
  await page.screenshot({ path: `shot-${tag}-top.png`, fullPage: false });

  // interact: change metabolism factor
  await page.selectOption('select', { index: 1 });

  // add extra intake
  await page.click('text=+ 추가');
  await page.waitForSelector('input[type=number]');

  // scroll to sleep diagnosis / science text
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.screenshot({ path: `shot-${tag}-mid.png` });

  // scroll to share card
  const shareBtn = page.locator('button:has-text("이 결과, 지금 공유하기")');
  await shareBtn.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `shot-${tag}-share.png` });

  // scroll to SEO sections + FAQ
  const faqHeading = page.locator('text=자주 묻는 질문');
  await faqHeading.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `shot-${tag}-seo.png` });

  // expand first FAQ
  const firstDetails = page.locator('details').first();
  await firstDetails.locator('summary').click();
  await page.screenshot({ path: `shot-${tag}-faq-open.png` });

  await page.screenshot({ path: `shot-${tag}-full.png`, fullPage: true });

  await page.close();
}

await run({ width: 1280, height: 900 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');

await browser.close();

console.log('CONSOLE_ERRORS:', errors.length);
errors.forEach(e => console.log(e));
