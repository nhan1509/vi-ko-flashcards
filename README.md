# Flashcard Việt–Hàn (SRS)

Ứng dụng web học từ vựng Việt ↔ Hàn cho một người dùng: chủ đề, xáo trộn, SRS (Again/Hard/Good/Easy), thêm từ thủ công, import CSV/TSV/Excel, mật khẩu bảo vệ nhẹ.

## Chạy local

```bash
cd Documents/vi-ko-flashcards
npm install
npm run db:push
npm run dev
```

Mở http://localhost:3000 — mật khẩu mặc định: `flashcard`

File mẫu import: [sample-words.csv](sample-words.csv)

## Biến môi trường

| Biến | Mô tả |
|------|--------|
| `DATABASE_URL` | SQLite local: `file:./prisma/dev.db` |
| `APP_PASSWORD` | Mật khẩu vào app. Để trống `""` nếu muốn tắt login |
| `SESSION_SECRET` | Chuỗi bí mật ký cookie phiên |

## Import

Cột: `vi,ko,topic,note`

```csv
vi,ko,topic,note
xin chào,안녕하세요,Chào hỏi,
cảm ơn,감사합니다,Chào hỏi,lịch sự
```

Có thể dán từ Google Sheets / Excel (tab-separated) hoặc upload `.xlsx`.

## Deploy lên internet (không cần VPS)

SQLite file **không** bền trên Vercel. Dùng **Turso** (SQLite cloud, free tier) hoặc đổi sang Neon Postgres.

### Cách khuyến nghị: Vercel + Turso

1. Tạo DB miễn phí tại [turso.tech](https://turso.tech)
2. Lấy URL dạng `libsql://...` và `TURSO_AUTH_TOKEN`
3. Đổi `src/lib/prisma.ts` sang adapter `@prisma/adapter-libsql` (xem comment trong file hoặc hướng dẫn Turso + Prisma)
4. Push schema: `DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx prisma db push`
5. Deploy lên [vercel.com](https://vercel.com): import repo, set env `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_PASSWORD`, `SESSION_SECRET`

### Neon (Postgres)

Nếu muốn Neon: đổi `provider` trong `prisma/schema.prisma` thành `postgresql`, dùng `@prisma/adapter-neon`, set `DATABASE_URL` Neon, rồi `prisma db push`.

## Stack

Next.js · Tailwind · Prisma · SQLite (local) · SM-2 SRS · Web Speech API (`ko-KR`)
