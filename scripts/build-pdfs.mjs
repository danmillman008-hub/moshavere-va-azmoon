import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';
import chromium from '@sparticuz/chromium';
import { inflate } from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PDF_DIR = path.join(ROOT, 'pdf');

const documents = [
  {
    archive: 'stitch_ (4).zip',
    output: 'weekly-work-report-page-1.pdf',
    title: 'فرم گزارش کار و پایش تست هفتگی — برگ ۱',
    layout: 'report',
  },
  {
    archive: 'stitch_ (5).zip',
    output: 'weekly-work-report-page-2.pdf',
    title: 'فرم گزارش کار و پایش تست هفتگی — برگ ۲',
    layout: 'report',
  },
  {
    archive: 'stitch_ (6).zip',
    output: 'weekly-study-planner-page-1.pdf',
    title: 'برنامه‌ریزی هفتگی — برگ ۱',
    layout: 'planner',
  },
  {
    archive: 'stitch_ (7).zip',
    output: 'weekly-study-planner-page-2.pdf',
    title: 'برنامه‌ریزی هفتگی — برگ ۲',
    layout: 'planner',
  },
  {
    archive: 'stitch_ (8).zip',
    output: 'answer-sheet-300-questions.pdf',
    title: 'پاسخ‌برگ خام ۳۰۰ تستی — A4',
    layout: 'answer-sheet',
  },
];

const palette = {
  surface: '#faf9f5',
  'surface-dim': '#dadad6',
  'surface-bright': '#faf9f5',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f4f4f0',
  'surface-container': '#eeeeea',
  'surface-container-high': '#e8e8e4',
  'surface-container-highest': '#e2e3df',
  'on-surface': '#1a1c1a',
  'on-surface-variant': '#46464b',
  'inverse-surface': '#2f312e',
  'inverse-on-surface': '#f1f1ed',
  outline: '#76777b',
  'outline-variant': '#c7c6cb',
  'surface-tint': '#5e5e62',
  primary: '#000000',
  'on-primary': '#ffffff',
  'primary-container': '#1b1b1f',
  'on-primary-container': '#848387',
  'inverse-primary': '#c7c6ca',
  secondary: '#bc000a',
  'on-secondary': '#ffffff',
  'secondary-container': '#e2241f',
  'on-secondary-container': '#fffbff',
  tertiary: '#000000',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#001551',
  'on-tertiary-container': '#537aff',
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',
  'primary-fixed': '#e3e2e6',
  'primary-fixed-dim': '#c7c6ca',
  'on-primary-fixed': '#1b1b1f',
  'on-primary-fixed-variant': '#46464a',
  'secondary-fixed': '#ffdad5',
  'secondary-fixed-dim': '#ffb4aa',
  'on-secondary-fixed': '#410001',
  'on-secondary-fixed-variant': '#930005',
  'tertiary-fixed': '#dce1ff',
  'tertiary-fixed-dim': '#b6c4ff',
  'on-tertiary-fixed': '#001551',
  'on-tertiary-fixed-variant': '#0039b3',
  background: '#faf9f5',
  'on-background': '#1a1c1a',
  'surface-variant': '#e2e3df',
};

const fontFamilies = {
  sans: ['Vazirmatn', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  'headline-xl': ['Space Grotesk', 'Vazirmatn', 'sans-serif'],
  'headline-xl-mobile': ['Space Grotesk', 'Vazirmatn', 'sans-serif'],
  'headline-lg': ['Space Grotesk', 'Vazirmatn', 'sans-serif'],
  'headline-md': ['Space Grotesk', 'Vazirmatn', 'sans-serif'],
  'title-md': ['IBM Plex Sans', 'Vazirmatn', 'sans-serif'],
  'body-lg': ['IBM Plex Sans', 'Vazirmatn', 'sans-serif'],
  'body-md': ['IBM Plex Sans', 'Vazirmatn', 'sans-serif'],
  'body-sm': ['IBM Plex Sans', 'Vazirmatn', 'sans-serif'],
  'label-md': ['JetBrains Mono', 'Vazirmatn', 'monospace'],
  'label-sm': ['JetBrains Mono', 'Vazirmatn', 'monospace'],
  'mono-metric': ['JetBrains Mono', 'Vazirmatn', 'monospace'],
};

const fontSizes = {
  'headline-md': ['22px', { lineHeight: '28px', fontWeight: '600' }],
  'headline-xl': ['40px', { lineHeight: '48px', fontWeight: '700' }],
  'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
  'headline-lg': ['28px', { lineHeight: '34px', fontWeight: '700' }],
  'title-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
  'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
  'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
  'label-md': ['13px', { lineHeight: '16px', fontWeight: '500' }],
  'mono-metric': ['24px', { lineHeight: '28px', fontWeight: '700' }],
  'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
  'headline-xl-mobile': ['30px', { lineHeight: '36px', fontWeight: '700' }],
};

const tokenSpacing = {
  'space-xs': '0.25rem',
  'space-sm': '0.5rem',
  'space-md': '1rem',
  'space-lg': '1.5rem',
  'space-xl': '2.5rem',
  gutter: '1rem',
  margin: '1.5rem',
};

const tailwindConfig = {
  content: documents.map(({ archive }) => {
    const archivePath = path.join(ROOT, archive);
    if (!existsSync(archivePath)) throw new Error(`آرشیو منبع پیدا نشد: ${archive}`);
    const files = unzipSync(readFileSync(archivePath));
    if (!files['code.html']) throw new Error(`فایل code.html در ${archive} پیدا نشد.`);
    return { raw: strFromU8(files['code.html']), extension: 'html' };
  }),
  theme: {
    extend: {
      colors: palette,
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: tokenSpacing,
      fontFamily: fontFamilies,
      fontSize: fontSizes,
    },
  },
  plugins: [forms, containerQueries],
};

const compiledTailwind = await postcss([tailwindcss(tailwindConfig)]).process(
  '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
  { from: undefined },
);

function makeFontFaces() {
  const fontSets = [
    {
      packageName: '@fontsource-variable/vazirmatn',
      family: 'Vazirmatn',
      subsets: ['arabic', 'latin-ext', 'latin'],
    },
    {
      packageName: '@fontsource-variable/ibm-plex-sans',
      family: 'IBM Plex Sans',
      subsets: ['latin-ext', 'latin'],
    },
    {
      packageName: '@fontsource-variable/space-grotesk',
      family: 'Space Grotesk',
      subsets: ['latin-ext', 'latin'],
    },
    {
      packageName: '@fontsource-variable/jetbrains-mono',
      family: 'JetBrains Mono',
      subsets: ['latin-ext', 'latin'],
    },
  ];
  const faces = [];

  for (const font of fontSets) {
    const cssPath = path.join(ROOT, 'node_modules', font.packageName, 'wght.css');
    if (!existsSync(cssPath)) throw new Error(`فونت موردنیاز نصب نیست: ${font.packageName}`);
    const packageDir = path.dirname(cssPath);
    const css = readFileSync(cssPath, 'utf8');

    for (const match of css.matchAll(/@font-face\s*\{[^}]+\}/g)) {
      const originalFace = match[0];
      const srcMatch = originalFace.match(/url\(\.\/files\/([^)'\"]+)\)/);
      if (!srcMatch) continue;
      const fileName = path.basename(srcMatch[1]);
      if (!font.subsets.some((subset) => fileName.includes(`-${subset}-wght-normal`))) continue;

      const fontPath = path.join(packageDir, 'files', fileName);
      const data = readFileSync(fontPath).toString('base64');
      const face = originalFace
        .replace(/font-family:\s*[^;]+;/, `font-family: '${font.family}';`)
        .replace(/font-display:\s*swap;/, 'font-display: block;')
        .replace(
          /src:\s*url\([^)]*\)\s*format\('woff2-variations'\);/,
          `src: url(data:font/woff2;base64,${data}) format('woff2');`,
        );
      faces.push(face);
    }
  }

  return faces.join('\n');
}

const fontCss = makeFontFaces();

function getPrintCss(layout) {
  const shared = `
    @page { size: A4 portrait; margin: 0; }
    html, body {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
  `;

  if (layout === 'report') {
    return `${shared}
      body { display: block !important; }
      .page-sheet {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-width: none !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 5mm 6mm !important;
        box-sizing: border-box !important;
        border: 0 !important;
        box-shadow: none !important;
        overflow: hidden !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    `;
  }

  if (layout === 'planner') {
    return `${shared}
      body { display: block !important; }
      main {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      main > div:first-child {
        display: block !important;
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #fff !important;
      }
      .pdf-page {
        display: flex !important;
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 4mm !important;
        box-sizing: border-box !important;
        border: 0 !important;
        box-shadow: none !important;
        overflow: hidden !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    `;
  }

  return `${shared}
    body { display: block !important; }
    .sheet-a4 {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-width: 210mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 5mm 6mm 4mm !important;
      box-sizing: border-box !important;
      border: 0 !important;
      box-shadow: none !important;
      overflow: hidden !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  `;
}

function buildHtml(source, document) {
  let html = source
    // Bundle Tailwind locally so PDF output never depends on the CDN at print time.
    .replace(/<script\b[^>]*src=["'][^"']*tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>/gi, '')
    // The inline config is only consumed by Tailwind's CDN runtime.
    .replace(/<script\b[^>]*id=["']tailwind-config["'][^>]*>[\s\S]*?<\/script>/gi, '')
    // All source scripts are interactive-only (answer bubbles / print-title hooks).
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    // Google Fonts and icon-font links are replaced with self-contained WOFF2 faces above.
    .replace(/<link\b[^>]*>/gi, (tag) => (/https?:\/\//i.test(tag) ? '' : tag));

  if (document.layout === 'planner') {
    let pageMarkerAdded = false;
    html = html.replace(/<div\b[^>]*\bclass=(["'])([^"']*)\1[^>]*>/gi, (tag, quote, classes) => {
      if (classes.includes('max-w-[210mm]') && classes.includes('min-h-[297mm]')) {
        pageMarkerAdded = true;
        return tag.replace(`class=${quote}${classes}${quote}`, `class=${quote}${classes} pdf-page${quote}`);
      }
      return tag;
    });
    if (!pageMarkerAdded) throw new Error(`نشانگر صفحه برای فایل ${document.archive} پیدا نشد.`);
  }

  const title = `<title>${document.title}</title>`;
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, title);
  } else {
    html = html.replace(/<head\b[^>]*>/i, (head) => `${head}\n${title}`);
  }

  const printStyle = getPrintCss(document.layout);
  const bundle = `<style id="pdf-local-fonts">${fontCss}</style>\n<style id="pdf-tailwind">${compiledTailwind.css}</style>\n<style id="pdf-a4-print">${printStyle}</style>`;
  return html.replace(/<\/head>/i, `${bundle}\n</head>`);
}

async function main() {
  await mkdir(PDF_DIR, { recursive: true });
  // The bundled serverless Chromium expects NSS/NSPR shared libraries; include the
  // compatible copies shipped with @sparticuz/chromium on non-AWS Linux hosts too.
  const runtimeRoot = await inflate(path.join(ROOT, 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
  process.env.LD_LIBRARY_PATH = [path.join(runtimeRoot, 'lib'), process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(path.delimiter);
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    for (const document of documents) {
      const archivePath = path.join(ROOT, document.archive);
      if (!existsSync(archivePath)) throw new Error(`آرشیو منبع پیدا نشد: ${document.archive}`);
      const files = unzipSync(readFileSync(archivePath));
      if (!files['code.html']) throw new Error(`فایل code.html در ${document.archive} پیدا نشد.`);

      const html = buildHtml(strFromU8(files['code.html']), document);
      const page = await browser.newPage();
      page.setDefaultTimeout(30_000);
      page.on('pageerror', (error) => console.error(`[${document.output}] ${error.message}`));
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await page.emulateMediaType('print');
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });

      const outputPath = path.join(PDF_DIR, document.output);
      const pdfBytes = await page.pdf({
        format: 'A4',
        preferCSSPageSize: true,
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        path: outputPath,
        scale: 1,
        waitForFonts: true,
      });

      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();
      if (pages.length !== 1) {
        throw new Error(`${document.output}: باید یک صفحه باشد، اما ${pages.length} صفحه ساخته شد.`);
      }

      // Chromium rounds CSS millimetres to its print raster. Normalize the page
      // box to the exact ISO A4 point dimensions without scaling the artwork.
      const a4Width = 595.275590551;
      const a4Height = 841.88976378;
      pages[0].setSize(a4Width, a4Height);
      pdf.setTitle(document.title);
      pdf.setSubject('فرم چاپی فارسی — کاغذ A4 عمودی');
      pdf.setCreator('Moshavere va Azmoon PDF builder');
      pdf.setProducer('Chromium + pdf-lib');

      const finalBytes = await pdf.save();
      await writeFile(outputPath, finalBytes);
      const { width, height } = pages[0].getSize();
      if (Math.abs(width - a4Width) > 0.01 || Math.abs(height - a4Height) > 0.01) {
        throw new Error(`${document.output}: اندازه صفحه A4 نیست (${width.toFixed(2)} × ${height.toFixed(2)} pt).`);
      }

      console.log(`✓ ${document.output}  |  A4 عمودی، یک صفحه، ${Math.round(finalBytes.length / 1024)} KB`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
