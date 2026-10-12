# robot.md — Claude Code handover

This file records everything built with Claude Code on this project, so you can pick up where we left off. Two Claude Code chats worked on it:

- **Chat A (Oct 10):** dashboard redesign, the three quizzes, server-side scoring for Medium, and the results reports.
- **Chat B (Oct 11):** MongoDB storage for teams, choices and scores, plus automatic keyword marking for Easy.

Earlier commits (Oct 8–9: scaffold, dashboard cards, header, home page) came before either chat.

> **Secrets are not in this file.** The MongoDB connection string lives in `.env.local`, which git ignores. Ask the project owner for it. The answer keys are in `app/lib/server/answerKeys.ts` (see [§5 Answer keys and scoring](#5-answer-keys-and-scoring)).

---

## 1. What the app does now

A team-based Squid Game–themed quiz event app (Next.js 16.4, React 19, Tailwind 4, MongoDB).

1. **Home (`/`)**: the team types a name and presses Enter. The team is saved to MongoDB, then sent to the dashboard.
2. **Dashboard (`/dashboard?teamName=…`)**: three cards (Easy, Medium, Hard) show the question type, scoring and a description. **Select** opens a confirmation popup. **Lock my choice** saves the choice (in the browser and in MongoDB) and sends the team to its quiz. The team can't come back to choose again.
3. **Quiz (`/quiz/easy`, `/quiz/medium`, `/quiz/hard`)**: one question at a time. **Next →** moves on, and the last question shows **Submit** instead. **← Previous** and the progress bar let teams go back and change answers before submitting. The browser Back button is blocked, and a refresh resumes where the team left off.
4. **Submit**: answers go to the server.
   - **Medium** (multiple choice) and **Easy** (keyword match) are marked automatically. The team sees its score and a per-question ✓/✗ breakdown, and the score is saved to MongoDB.
   - **Hard** answers are saved to MongoDB for organisers to mark by hand. The team sees a report of its answers.

| Tier | Format | Questions | Scoring | Marking |
|---|---|---|---|---|
| Easy | Descriptive: emoji decoder (Q1–5) + word unscramble (Q6–10). Has a **Skip** button. | 10 | +5 correct, 0 wrong, 0 skipped (max 50) | **Automatic**, by keyword (server) |
| Medium | Multiple choice A–D | 5 | +20 correct, −10 wrong (max 100) | **Automatic** (server) |
| Hard | Descriptive: written answers (emoji row, Who-am-I, puzzle, code bugs, license table) | 5 | +30 correct, −20 wrong (shown on card) | **Manual**: answers saved, `score` stays `null` |

The questions come from the PDFs in `docs/`. These are committed, but they include the answer keys, so never move them into `public/`.

---

## 2. Running it

```bash
npm install
cp .env.example .env.local   # then put the real MONGODB_URI in .env.local
npm run dev                  # http://localhost:3000
```

- **Environment variables:** `MONGODB_URI` (required) and `MONGODB_DB` (defaults to `squidgame`). See `.env.example`.
- **Atlas network access:** the machine running the app must be on the cluster's Network Access list, or saves fail.
- **Needs a running server:** the app can't be a static export, because scoring and database writes happen in route handlers. Run `npm run dev`/`npm start` or deploy to a host that runs Next.js.
- **Install fix from Chat A:** at one point `@next/swc-darwin-arm64` was corrupted (a truncated download), so Turbopack failed with "native bindings are not available". The fix was to delete `node_modules/@next/swc-darwin-arm64` and run `npm install` again.
- **`next.config.ts` flags:** `experimental.agentFeedback`, `cacheComponents`, `partialPrefetching`, and a Turbopack CSS rule for Tailwind. `next dev` rewrites `AGENTS.md` on every start; commit it so the tree stays clean.

**Testing a quiz yourself:** the browser remembers which tier a team name locked, and MongoDB keeps the first lock and first submission. Use a **new team name** for each test run, or clear the site data for localhost and delete the test team from the `teams` collection.

---

## 3. File map (what was added or changed)

```
app/
  page.tsx                       Home: team name entry → POST /api/teams → /dashboard
  dashboard/page.tsx             Cards + confirmation; locks tier, redirects to /quiz/<tier>
  quiz/easy|medium|hard/page.tsx Thin wrappers around <QuizRunner>
  components/
    QuizRunner.tsx               ★ The whole quiz flow (see §4.3)
    DifficultyCard.tsx           Dashboard card (rebuilt in Chat A)
    ConfirmationModal.tsx        "Lock my choice" popup with per-tier message
    ArenaBackground.tsx          Animated Squid Game background (replaced the photo)
    RichText.tsx                 Renders *bold* and `code` in data strings
    LockedBanner.tsx             ⚠ No longer reachable (every tier goes to a quiz)
  data/
    difficultyTiers.ts           Card text, scoring, confirmation messages per tier
    easyQuiz.ts / mediumQuiz.ts / hardQuiz.ts   Questions only — NO answers
  lib/
    trialStorage.ts              localStorage: locked tier + quiz progress per team
    server/answerKeys.ts         'server-only' — Medium key + Easy keywords
    server/db.ts                 'server-only' — MongoDB client + team record helpers
  api/
    teams/route.ts               POST enroll team
    teams/lock/route.ts          POST lock difficulty (first lock wins)
    quiz/medium/score/route.ts   POST grade Medium, save score
    quiz/easy/score/route.ts     POST grade Easy by keyword, save score
    quiz/submit/route.ts         POST save Hard answers (no score)
  types/difficulty.ts, types/quiz.ts
  globals.css                    + arena-rise / arena-drift / arena-scan keyframes
public/images/
  wikiclub-logo-light.png, nmamit-logo-light.png   Light versions for dark backgrounds (Chat A)
.env.example, .gitignore (now allows .env.example)  (Chat B)
```

---

## 4. Changes in detail

### 4.1 Home page (`app/page.tsx`) — Chat A, plus enrollment from Chat B
- **Search bar:** the team-name input sits at the exact vertical centre of the screen. The Squid Game logo sits just above it; the PNG's transparent padding is cropped with CSS (`aspect-[2/1] object-cover`) and the logo is larger.
- **Partner logos:** the WikiClub and NMAMIT logos are in one translucent glass panel at the bottom, matching the search bar, with a "Presented by" label. They use new **light** versions of the PNGs (white text, generated from the originals, which are untouched).
- **Enrollment (Chat B):** on submit, `POST /api/teams` is sent fire-and-forget with `keepalive`, so navigation isn't delayed.

### 4.2 Dashboard (`app/dashboard/page.tsx`, `DifficultyCard.tsx`) — Chat A
- **Background:** the staircase photo was replaced by `ArenaBackground`, an animated scene with pink/teal glows, the ○△□ business-card pattern, a large outlined "456", floating ○△□ shapes, a red "Red Light, Green Light" scanner beam, vignette and grain. It respects `prefers-reduced-motion`.
- **Hero:** the "PHASE 01 // SECTOR ALLOCATION PROTOCOL" line and the tier legend were removed and spacing tightened, so all three cards fit on a 1470×834 screen.
- **Cards** were rebuilt:
  - Equal heights, with buttons aligned.
  - Fixed hover classes. Tailwind can't generate template-built names like `` hover:${x} ``, so every class is now written out in full.
  - Easy is green (it was blue), Medium amber, Hard red.
  - Survival-odds bar.
  - The "Rules & penalties" drawer was removed entirely.
- **Card content** (all in `difficultyTiers.ts`):
  - **Easy:** "DESCRIPTIVE ANSWERS", Correct **+5** / Wrong **−0**.
  - **Medium:** "MCQ QUESTIONS", **+20 / −10**.
  - **Hard:** "DESCRIPTIVE ANSWERS", **+30 / −20**.
  - Time and bounty are no longer shown on cards.
  - Descriptions were rewritten, and `*text*` renders bold, e.g. **150 points**.
- **Confirmation popup:** shows each tier's own message and bold question (`confirmMessage` / `confirmQuestion`) and the tier's scoring line. The old rules summary and notice are gone.
- **Lock:** `handleConfirmLock` does the following for every tier:
  1. Saves the lock to localStorage.
  2. Sends `POST /api/teams/lock` (Chat B).
  3. Runs `router.replace('/quiz/<tier>?teamName=…')`.

  On load, if the team already has a lock, the dashboard redirects to that quiz.

### 4.3 Quizzes (`QuizRunner.tsx`) — built in Chat A, Skip and submit-to-server added in Chat B
- **Question kinds** (`types/quiz.ts`):
  - `mcq`: title, context blocks, question, options A–D.
  - `emoji`: emojis, category and hint.
  - `unscramble`: letters and hint; the answer is stored in capitals.
  - `written`: title, context blocks, question and an optional placeholder.

  Context blocks can be `text`, `code`, `emojis` (a labelled row) or `table`.
- **Answer box** for descriptive questions works like a notepad:
  - The `textarea` uses `wrap="off"`, so text stays on one line and scrolls sideways.
  - Only Enter starts a new line, and the box grows with each line.
  - The cursor is coloured and blinking, and the box has focus when each question appears.
  - **Ctrl/⌘+Enter** does the same as Next/Submit.
  - There is no length limit.
- **Navigation:**
  - **Next →** is disabled until there's an answer (except Skip on Easy).
  - The last question shows **Submit**.
  - **← Previous** and clicking progress segments go back. Teams can reach answered questions and the first unanswered one, but can't skip ahead.
  - The current segment shows white.
- **Locking the team in:**
  - The quiz page redirects to the dashboard if this team hasn't locked this tier.
  - A `popstate` trap blocks the browser Back button.
  - Progress is saved in localStorage, so a refresh resumes.
  - SSR-safe: storage is read only after hydration (`useSyncExternalStore`). An earlier version caused a hydration mismatch.
- **Final Submit** (Chat B): the answers go to `scoreEndpoint` (Easy/Medium) or `/api/quiz/submit` (Hard). The team sees the finish screen only when the save succeeds. Otherwise it shows "Couldn't submit… press Submit again".
- **Finish screen:**
  - **Auto-scored tiers:** a big score out of the maximum, then one row per question with ✓/✗/Skipped, the team's answer and its points. It never shows the correct option.
  - **Hard:** a "Your answers" report, one card per question with its summary and the team's full answer.

### 4.4 Server, database and scoring — Medium scoring in Chat A, database and Easy marking in Chat B
- **`answerKeys.ts`** imports `'server-only'`, so a build fails if browser code imports it. A check of the browser JS confirmed the key isn't in any client bundle; it appears only in `.next/dev/server`.
- **`db.ts`** caches the MongoDB client on `globalThis` (one pool across hot reloads) and adds a unique index on `teamKey`.
- **`teams` collection** has one document per team:
  ```
  teamKey (lowercased name, unique), teamName, difficulty, score, maxScore,
  answers, enrolledAt, lockedAt, submittedAt
  ```
  - Team names are case-insensitive.
  - **The first lock wins.** A later different difficulty is ignored.
  - **The first submission wins.** Resubmitting doesn't overwrite the saved score.
- **Medium:** exact match against the key.
- **Easy:** an answer is correct if it **contains** any of the question's keywords, ignoring case.
  - `node.js` is also accepted for Q2.
  - Substrings count, so "forked" counts for fork and "commits" for commit.
  - An empty answer is "skipped" and scores 0.
- **Hard:** stored with `score: null` for manual marking.

---

## 5. Answer keys and scoring

- **Where:** `app/lib/server/answerKeys.ts` holds `MEDIUM_ANSWER_KEY` (option letter per question) and `EASY_ANSWER_KEY` (keywords per question). Edit there to change answers.
- **Points:** set per tier in `difficultyTiers.ts → scoring`. The score routes read from there.
- **Hard:** has no key in code. Mark against `docs/Hard_Level_Questions (1).pdf` (Section B), then fill in `score`/`maxScore` in MongoDB.

---

## 6. Known issues and next steps

**Security and fairness**
1. **Scores can be probed.** Score endpoints return a per-question ✓/✗ for any request. Someone using devtools could call `/api/quiz/medium/score` with **made-up team names** and discover every answer in a few tries; the "first submission wins" rule only protects real team names. **Fix:** make the score endpoints refuse teams not enrolled and locked to that tier in MongoDB, and/or return results only for the team's first submission.
2. **The lock is checked in the browser only.** The dashboard and quiz pages check localStorage, not MongoDB, so clearing browser data or switching device lets a team see the dashboard again. MongoDB still keeps the first choice and first submission. **Fix:** check `GET` lock status from the database on the dashboard and quiz pages.
3. **No authentication.** Anyone can use any team name.
4. **Exposed password.** The MongoDB password was pasted into a chat. **Rotate it in Atlas after the event** and update `.env.local`.

**Product and content to-dos**
5. **Hard marking is manual.** A small admin page to list teams, read Hard answers and enter scores would help, as would a results/leaderboard view of the `teams` collection.
6. **Easy wrong = 0.** A wrong answer and a skip score the same. Confirm with organisers whether wrong answers should lose points; it's one number in `difficultyTiers.ts`.
7. **Outdated hero text.** The dashboard text "Review the three trial sectors… strict time caps, and escalating penalty multipliers" no longer matches the cards and should be reworded.
8. **Placeholder team info.** The header always shows the placeholder "TEAM-456 / SESSION 01 // POOL A" from `DEFAULT_TEAM_SESSION`; only the team name is real.
9. **Leftover prototype text.**
   - `ConfirmationModal` still shows a "[PROTOTYPE] Lock is local React state…" footnote, which teams can see.
   - `LockedBanner` and `handleResetLock` are now unreachable.
   - The unused tier fields `rules`, `penaltyNotice`, `timeLimit` and `bountyMultiplier` remain in the data.

   All of these can be removed.
10. **Hard Q1 emoji.** For (d) the PDF shows a red bird, but 🐦 renders grey-blue on Apple devices.
11. **Long questions scroll.** Hard Q4/Q5 and the finish reports are taller than a laptop screen, so teams scroll.
12. **`<img>` lint warnings.** `app/page.tsx` has three warnings suggesting `next/image`. They're harmless.

---

## 7. How things were verified

- **Checks:** every change was type-checked (`tsc --noEmit`) and linted.
- **Browser testing:** Chat A drove headless Chrome through the DevTools protocol. Scripts lived in a temporary scratch folder and aren't committed. The runs covered:
  - the lock → quiz redirect
  - a disabled Next with an empty answer
  - Previous and re-answering
  - refresh-resume and the Back-button trap
  - an unlocked team being redirected out of a quiz
  - a team locked to one tier being kept out of the others
  - score display, and the answer key being absent from client JS

  Screenshots were checked at 1470×834.
- **Database (Chat B):** tested against the running dev server with throwaway teams. Medium scored −20/100 and Easy 35/50, both saved to MongoDB, and the test records were deleted afterwards. Chat B didn't click through the Easy **Skip** button in a browser; please check it once.
