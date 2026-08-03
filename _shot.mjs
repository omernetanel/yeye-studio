import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 690 } });
await p.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
await p.screenshot({ path: '/tmp/claude-0/-home-user-sorozinchef/82de9920-7825-53a4-83ab-7f2e333d7330/scratchpad/hero.png' });
await b.close();
