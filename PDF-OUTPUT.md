# خروجی‌های آمادهٔ چاپ

پنج فایل PDF از فایل‌های `code.html` داخل آرشیوهای Stitch ساخته شده‌اند. همهٔ خروجی‌ها **A4 عمودی، دقیقاً یک صفحه** هستند؛ فونت‌های فارسی/لاتین داخل فرایند ساخت آماده‌سازی می‌شوند تا خروجی به CDN یا اینترنت وابسته نباشد.

| فایل | محتوا |
| --- | --- |
| [`pdf/weekly-work-report-page-1.pdf`](pdf/weekly-work-report-page-1.pdf) | فرم گزارش کار هفتگی — برگ ۱ (شنبه تا دوشنبه) |
| [`pdf/weekly-work-report-page-2.pdf`](pdf/weekly-work-report-page-2.pdf) | فرم گزارش کار هفتگی — برگ ۲ (سه‌شنبه تا جمعه) |
| [`pdf/weekly-study-planner-page-1.pdf`](pdf/weekly-study-planner-page-1.pdf) | برنامه‌ریزی هفتگی — برگ ۱ |
| [`pdf/weekly-study-planner-page-2.pdf`](pdf/weekly-study-planner-page-2.pdf) | برنامه‌ریزی هفتگی — برگ ۲ و جمع‌بندی |
| [`pdf/answer-sheet-300-questions.pdf`](pdf/answer-sheet-300-questions.pdf) | پاسخ‌برگ خام ۳۰۰ تستی |

## بازسازی خروجی‌ها

با Node.js نسخهٔ `22.17` یا بالاتر:

```bash
npm ci
npm run build:pdf
```

برای چاپ، اندازهٔ کاغذ را روی **A4** و مقیاس را روی **۱۰۰٪ / Actual size** بگذارید.
