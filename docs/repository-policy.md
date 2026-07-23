# Quy định push repository

Tài liệu này dùng để xác định rõ file nào nên đưa lên Git và file nào phải giữ ở local trước khi deploy InsightPilot.

## Nên push

Các file source code và cấu hình cần push:

- `app/`: giao diện Next.js, API routes, layout và CSS.
- `lib/`: business logic, analytics engine, insight engine, security, AI provider và type definitions.
- `tests/`: test cho analytics, security và assistant routing.
- `docs/`: tài liệu kỹ thuật của dự án.
- `.github/workflows/`: CI workflow nếu muốn GitHub tự chạy kiểm tra.
- `package.json` và `package-lock.json`: dependency và lockfile.
- `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`: cấu hình TypeScript, Next.js, ESLint, test.
- `Dockerfile` và `.dockerignore`: dùng cho build/deploy container.
- `.gitignore`: quy định file không được commit.
- `README.md`: hướng dẫn chạy, test và giải thích dự án.

## Không nên push

Các file local/runtime không được push:

- `node_modules/`: dependency cài local, có thể cài lại bằng `npm install`.
- `.next/`: output build của Next.js.
- `.npm-cache/`: cache npm local.
- `.env`, `.env.local`, `.env.*.local`: chứa biến môi trường hoặc API key.
- `data/`: chứa SQLite runtime như `data/insightpilot.db`.
- `*.db`, `*.sqlite`, `*.sqlite3`, `*.db-journal`: database local và journal file.
- `coverage/`: output test coverage nếu có.
- `*.log`: file log local.
- `.agents/`, `.codex/`: metadata/tooling local của môi trường làm việc.
- `aidlc-docs/`, `aws-aidlc-rule-details/`: tài liệu/quy trình AI-DLC sinh ra trong quá trình làm việc, không phải source product cần đưa lên portfolio repo.

## Lưu ý về database

Database `data/insightpilot.db` được tạo từ seed data khi app chạy, nên không cần commit. Khi deploy production thật, nên dùng database managed như PostgreSQL hoặc SQLite volume riêng tùy nền tảng.

## Lưu ý về API key

Không commit `OPENAI_API_KEY`. Nếu deploy, đặt biến môi trường trên nền tảng deploy:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

Nếu không có API key, InsightPilot vẫn chạy bằng local insight engine.

## Checklist trước khi push

Chạy các lệnh sau:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Kiểm tra không có secret hoặc database bị đưa vào Git:

```powershell
Get-ChildItem -Recurse -Force -File -Include .env,.env.local,*.db,*.sqlite,*.sqlite3
```

Nếu dùng Git, kiểm tra danh sách file chuẩn bị commit:

```powershell
git status --short
```
