# ERP

نظام تخطيط موارد المؤسسة (ERP) — ويب، عربي (RTL) مع قابلية الترجمة للإنجليزية.

## التقنيات

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **PostgreSQL** + **Prisma**
- جلسات دخول موقّعة (JWT في كوكي `httpOnly`) وصلاحيات حسب الدور

## التشغيل محلياً

```bash
npm install
cp .env.example .env          # ثم عدّل DATABASE_URL و AUTH_SECRET
npm run db:migrate            # إنشاء الجداول
npm run db:seed               # إنشاء حساب مدير النظام
npm run dev                   # http://localhost:3000
```

حساب المدير الافتراضي: `admin@erp.local` / `Admin@12345` — **غيّره فوراً** (أو مرّر
`SEED_ADMIN_EMAIL` و `SEED_ADMIN_PASSWORD` قبل `db:seed`).

## هيكل المشروع

| المسار | المحتوى |
|---|---|
| `prisma/schema.prisma` | جداول قاعدة البيانات |
| `src/i18n/ar.ts` | كل نصوص الواجهة (لإضافة الإنجليزية لاحقاً) |
| `src/app/globals.css` | ألوان الهوية |
| `src/lib/auth.ts` | الدخول والصلاحيات |
| `src/app/(app)/` | صفحات النظام بعد الدخول |
| `src/app/(app)/admin/` | إدارة المستخدمين والإدارات |

## المراحل

1. ✅ الأساس: الدخول، الصلاحيات، الإدارات، المستخدمون، الصفحة الرئيسية
2. ⏳ الطلبات ومسارات التعميد
3. التعاميم والاجتماعات
4. الموارد البشرية والحضور
5. المالية والمحاسبة
6. المحادثات الداخلية وتطبيق الجوال
