# Electronic E-Book
- Credentials to log in are in .env in project root
- Sometimes will have to close chrome and log in again
- Chapter screenshots already captured in /chapter-screenshots/chapter1-8/
https://www.blinklearning.com/v/1770901482/themes/tmpux/launch.php#responsive/book/3428066/211745078

# Vocab Tester App
Next.js 15 app in `vocab-tester-app/`. Run with `npm run dev` from that directory.

## Architecture
- **Pages**: `src/app/page.tsx` (home), `src/app/test/{nouns,verbs,perfekt,flashcards}/page.tsx`
- **Test components**: `src/components/{noun-test,verb-grid,perfekt-test,flashcard}.tsx` — each is a self-contained test mode with filtering, scoring, wrong-word tracking, and practice-mistakes mode
- **Hidden test**: `src/app/test/praeteritum/` + `src/components/praeteritum-test.tsx` — combined Perfekt/Präteritum test (fill-in-the-blank + tense identification). Hidden from home page while rethinking approach. Data in `data/praeteritum.json`.
- **Data**: `src/lib/data.ts` — nouns, verbs, perfekt, präteritum entries parsed from chapter data
- **Storage**: `src/lib/storage.ts` — localStorage helpers for wrong words, high scores, and attempt leaderboard

## Key patterns
- All test components share the same structure: filter bar, score counter, question UI, finished screen
- State is saved via `useRef` + `pagehide` listener for reliable mobile auto-save (React cleanup alone is unreliable on mobile)
- Practice mistakes mode pauses the main test progress in `pausedProgress` ref — the attempt is only saved on actual page leave, not on toggle
- Wrong words are tracked per mode in localStorage (`wrong:{mode}`)
- Attempts feed the "Best attempts" leaderboard on the home page, sorted by total questions then percentage
- Test components are pure — they don't use Next.js Link; page wrappers handle navigation