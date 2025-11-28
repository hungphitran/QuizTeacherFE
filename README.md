## QuizTeacher FE

Next.js App Router + Tailwind interface for the QuizTeacher platform. The app provides:

- **Auth flow** (`/login`, `/register`) connected to QuizTeacher user service
- **Admin workspace** (create/update/delete quizzes, review attempts & answers)
- **Student workspace** (dashboard, quiz catalog, exam-taking experience with timer)
- **Shared infra**: JWT persistence, API helpers, SWR data hooks, unit/e2e tests

APIs are described in `api_documentation.md` and are expected to be available at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3000/api`).

## Getting started

```bash
cp .env.local.example .env.local   # adjust API base URL if needed
npm install
npm run dev
```

Visit `http://localhost:3000` for the landing page. Authenticated areas:

- Admin: `/admin/quizzes`
- Student: `/student/dashboard`

## Available scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start Next.js dev server                         |
| `npm run build`    | Production build                                 |
| `npm run start`    | Serve production build                           |
| `npm run lint`     | ESLint over the project                          |
| `npm run test`     | Vitest unit tests (API helpers, hooks, etc.)     |
| `npm run test:watch` | Watch-mode Vitest                              |
| `npm run test:e2e` | Playwright smoke suite (requires `npm run dev`)  |

## Architecture notes

- `src/components/providers/AuthProvider.tsx` stores JWT tokens + user info in `localStorage` and exposes guards via `ProtectedRoute`.
- `src/lib/api.ts` centralizes `fetch` logic, error handling, and authorization headers.
- `src/services/*` wrap API endpoints for auth, quizzes, attempts, and answers.
- `src/app/(admin)` and `src/app/(student)` define role-specific layouts, navigation, and pages.
- SWR (`useAuthorizedSWR`) keeps lists (quizzes, attempts) in sync with minimal code.
- Vitest + Playwright ensure regressions are caught early.

## Testing

1. **Unit**: `npm run test`
   - Example: `__tests__/services/apiClient.test.ts`
2. **E2E smoke**: in one terminal run `npm run dev`; in another run `npm run test:e2e`.

## Future enhancements

- Hook up question authoring UI for quiz creation.
- Add real-time updates during attempts (teacher monitoring).
- Integrate role/permission management UI for administrators.
