import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NOUNS_PATH = resolve(__dirname, '../vocab-tester-app/data/nouns.json');
const REPORT_PATH = resolve(__dirname, 'article-validation-report.json');
const PROGRESS_PATH = resolve(__dirname, 'article-validation-progress.json');

const DELAY_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function genderToArticle(gender) {
  if (gender.includes('Maskulinum') || gender.includes('maskulin')) return 'der';
  if (gender.includes('Femininum') || gender.includes('feminin')) return 'die';
  if (gender.includes('Neutrum') || gender.includes('neutrum')) return 'das';
  return null;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
      redirect: 'follow',
    });
    const text = await res.text();
    if (!res.ok) return null;
    return text;
  } catch {
    return null;
  }
}

// Use Wiktionary API for structured data (more reliable than scraping)
async function lookupWiktionaryApi(word) {
  const url = `https://de.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NounArticleValidator/1.0 (educational project)' }
    });
    const data = await res.json();
    if (data.error) return null;
    const wikitext = data.parse?.wikitext?.['*'] || '';

    // Look for German noun section with genus
    // Pattern: {{Deutsch Substantiv Übersicht ... |Genus=m/f/n
    const genusMatch = wikitext.match(/\|Genus\s*=\s*(m|f|n)\b/);
    if (genusMatch) {
      const g = genusMatch[1];
      if (g === 'm') return { article: 'der', gender: 'Maskulinum', source: 'wiktionary-api' };
      if (g === 'f') return { article: 'die', gender: 'Femininum', source: 'wiktionary-api' };
      if (g === 'n') return { article: 'das', gender: 'Neutrum', source: 'wiktionary-api' };
    }

    // Alternative: look for {{m}}, {{f}}, {{n}} near "Substantiv" in the wikitext
    // The word type line often looks like: {{Wortart|Substantiv|Deutsch}}, {{m}}
    const substantivSection = wikitext.match(/Wortart\|Substantiv\|Deutsch\}\}[^\n]*\{\{([mfn])\}\}/);
    if (substantivSection) {
      const g = substantivSection[1];
      if (g === 'm') return { article: 'der', gender: 'Maskulinum', source: 'wiktionary-api' };
      if (g === 'f') return { article: 'die', gender: 'Femininum', source: 'wiktionary-api' };
      if (g === 'n') return { article: 'das', gender: 'Neutrum', source: 'wiktionary-api' };
    }

    return null;
  } catch {
    return null;
  }
}

// Fallback: scrape Duden directly
async function lookupDuden(word) {
  const directUrl = `https://www.duden.de/rechtschreibung/${encodeURIComponent(word)}`;
  let html = await fetchPage(directUrl);
  if (html) {
    const m = html.match(/Substantiv,\s*(maskulin|feminin|Neutrum)/i);
    if (m) return { article: genderToArticle(m[1]), gender: m[1], source: 'duden-direct' };
  }
  await sleep(DELAY_MS);

  // Search fallback
  const searchUrl = `https://www.duden.de/suchen/dudenonline/${encodeURIComponent(word)}`;
  html = await fetchPage(searchUrl);
  if (html) {
    const linkMatch = html.match(/href="(\/rechtschreibung\/[^"]+)"/);
    if (linkMatch) {
      await sleep(DELAY_MS);
      const resultHtml = await fetchPage(`https://www.duden.de${linkMatch[1]}`);
      if (resultHtml) {
        const m = resultHtml.match(/Substantiv,\s*(maskulin|feminin|Neutrum)/i);
        if (m) return { article: genderToArticle(m[1]), gender: m[1], source: 'duden-search' };
      }
    }
  }
  return null;
}

async function main() {
  const nouns = JSON.parse(readFileSync(NOUNS_PATH, 'utf-8'));

  const seen = new Set();
  const unique = [];
  for (const noun of nouns) {
    if (!seen.has(noun.german)) {
      seen.add(noun.german);
      unique.push(noun);
    }
  }

  console.log(`Total nouns: ${nouns.length}, Unique: ${unique.length}`);

  // Load progress
  let progress = { matches: [], mismatches: [], notFound: [], completed: new Set() };
  if (existsSync(PROGRESS_PATH)) {
    const saved = JSON.parse(readFileSync(PROGRESS_PATH, 'utf-8'));
    progress.matches = saved.matches || [];
    progress.mismatches = saved.mismatches || [];
    progress.notFound = saved.notFound || [];
    progress.completed = new Set(saved.completedWords || []);
    console.log(`Resuming: ${progress.completed.size} words already done`);
  }

  const { matches, mismatches, notFound, completed } = progress;
  let processed = completed.size;

  function saveProgress() {
    writeFileSync(PROGRESS_PATH, JSON.stringify({
      matches, mismatches, notFound,
      completedWords: [...completed],
      timestamp: new Date().toISOString(),
    }, null, 2));
  }

  for (const noun of unique) {
    const { german, article } = noun;
    if (completed.has(german)) continue;

    processed++;

    // Try Wiktionary API first (fast, reliable, no rate limiting)
    let result = await lookupWiktionaryApi(german);

    // If Wiktionary fails, try Duden
    if (!result) {
      await sleep(DELAY_MS);
      result = await lookupDuden(german);
    }

    if (!result) {
      notFound.push({ german, ourArticle: article });
      console.log(`[${processed}/${unique.length}] ${german}: NOT FOUND`);
    } else if (result.article !== article) {
      mismatches.push({
        german,
        ourArticle: article,
        dudenArticle: result.article,
        dudenGender: result.gender,
        source: result.source,
      });
      console.log(`[${processed}/${unique.length}] ${german}: MISMATCH — ours: ${article}, Duden: ${result.article} (${result.gender})`);
    } else {
      matches.push({ german, article, source: result.source });
      if (processed % 50 === 0) {
        console.log(`[${processed}/${unique.length}] ${german}: OK (${matches.length} matched so far)`);
      }
    }

    completed.add(german);
    if (processed % 20 === 0) saveProgress();
    await sleep(100); // Light delay for API politeness
  }

  saveProgress();

  console.log('\n========== RESULTS ==========');
  console.log(`Matched: ${matches.length}`);
  console.log(`Mismatches: ${mismatches.length}`);
  console.log(`Not found: ${notFound.length}`);

  if (mismatches.length > 0) {
    console.log('\n--- MISMATCHES ---');
    for (const m of mismatches) {
      console.log(`  ${m.german}: ours="${m.ourArticle}" duden="${m.dudenArticle}" (${m.dudenGender})`);
    }
  }

  if (notFound.length > 0) {
    console.log('\n--- NOT FOUND ---');
    for (const n of notFound) {
      console.log(`  ${n.german} (ours: ${n.ourArticle})`);
    }
  }

  // Build full report with per-word source info
  const report = {
    summary: {
      total: unique.length,
      matched: matches.length,
      mismatches: mismatches.length,
      notFound: notFound.length,
      timestamp: new Date().toISOString(),
    },
    // Every word with its article, validation source, and status
    words: [
      ...matches.map(m => ({
        german: m.german,
        article: m.article,
        status: 'confirmed',
        source: m.source,
      })),
      ...mismatches.map(m => ({
        german: m.german,
        article: m.ourArticle,
        status: 'mismatch-flagged',
        source: m.source,
        flaggedArticle: m.dudenArticle,
        flaggedGender: m.dudenGender,
      })),
      ...notFound.map(n => ({
        german: n.german,
        article: n.ourArticle,
        status: 'not-found',
        source: null,
      })),
    ].sort((a, b) => a.german.localeCompare(b.german, 'de')),
    mismatches,
    notFound,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${REPORT_PATH}`);
}

main().catch(console.error);
