# Graph Studio — نسخه‌ی ویندوز

همان برنامه‌ی اندروید (همان فایل `app/index.html`، بدون هیچ تغییری) داخل یک پنجره‌ی ویندوز.

## ساخت فایل exe با GitHub (مثل APK)
1. یک repository جدید در GitHub بساز و همه‌ی محتویات این پوشه را داخلش آپلود کن.
2. اگر پوشه‌ی `.github` آپلود نشد: فایل `windows.yml` را در مسیر `.github/workflows/windows.yml` بساز.
3. به تب **Actions** برو و **Build Graph Studio Windows** را اجرا کن (Run workflow).
4. بعد از تمام شدن، پایین صفحه در بخش **Artifacts** فایل `Graph-Studio-Windows` را دانلود کن. داخلش دو فایل هست:
   - `Graph-Studio-Setup-3.6.0.exe` → نصب‌کننده (نیاز به دسترسی ادمین ندارد)
   - `Graph-Studio-Portable-3.6.0.exe` → بدون نصب، مستقیم اجرا می‌شود

## اجرا روی کامپیوتر خودت (اختیاری)
با Node.js نصب‌شده: `npm install` و بعد `npm start`

## کلیدها
- `F11` تمام‌صفحه
- `Ctrl+Shift+I` ابزار توسعه (فقط برای عیب‌یابی)
