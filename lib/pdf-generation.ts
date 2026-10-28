// Server-side only: never import from client components.
import fs from 'fs';

export interface PdfOptions {
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
}

const CHROME_CANDIDATES = [
  process.env.CHROME_EXECUTABLE_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/local/bin/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
].filter(Boolean) as string[];

function findChrome(): string | null {
  for (const p of CHROME_CANDIDATES) {
    try { if (fs.existsSync(p)) return p; } catch { /* ignore */ }
  }
  return null;
}

/**
 * Abacus HTML→PDF service (Playwright-backed). Used when the hosting
 * environment provides the credentials; otherwise we render locally.
 */
async function generateViaAbacus(html: string, opts: PdfOptions): Promise<Buffer | null> {
  const token = process.env.ABACUSAI_API_KEY;
  if (!token) return null;
  const base = 'https://apps.abacus.ai/api';
  const createRes = await fetch(`${base}/createConvertHtmlToPdfRequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deployment_token: token,
      app_id: process.env.WEB_APP_ID ?? '',
      html_content: html,
      pdf_options: {
        format: opts.format ?? 'A4',
        landscape: opts.landscape ?? true,
        print_background: true,
        display_header_footer: !!(opts.headerTemplate || opts.footerTemplate),
        header_template: opts.headerTemplate ?? '<span></span>',
        footer_template: opts.footerTemplate ?? '<span></span>',
        margin: opts.margin,
      },
    }),
  });
  if (!createRes.ok) return null;
  const { request_id } = (await createRes.json()) ?? {};
  if (!request_id) return null;

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const statusRes = await fetch(`${base}/getConvertHtmlToPdfStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id, deployment_token: token }),
    });
    const data = await statusRes.json().catch(() => null);
    const status = data?.status ?? 'FAILED';
    if (status === 'SUCCESS' && data?.result?.result) return Buffer.from(data.result.result, 'base64');
    if (status === 'FAILED') return null;
  }
  return null;
}

/** Local headless Chromium render via puppeteer-core. */
async function generateViaChromium(html: string, opts: PdfOptions): Promise<Buffer> {
  const executablePath = findChrome();
  if (!executablePath) throw new Error('No Chromium executable available for PDF rendering');
  const puppeteer = (await import('puppeteer-core')).default;
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    const pdf = await page.pdf({
      format: opts.format ?? 'A4',
      landscape: opts.landscape ?? true,
      printBackground: true,
      displayHeaderFooter: !!(opts.headerTemplate || opts.footerTemplate),
      headerTemplate: opts.headerTemplate ?? '<span></span>',
      footerTemplate: opts.footerTemplate ?? '<span></span>',
      margin: opts.margin,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generatePdfFromHtml(html: string, opts: PdfOptions = {}): Promise<Buffer> {
  // Prefer local Chromium when available (fast, no network); fall back to Abacus service.
  if (findChrome()) {
    try { return await generateViaChromium(html, opts); } catch (err) { console.error('[pdf] chromium failed', err); }
  }
  const remote = await generateViaAbacus(html, opts).catch((err) => { console.error('[pdf] abacus failed', err); return null; });
  if (remote) return remote;
  throw new Error('PDF generation failed');
}
