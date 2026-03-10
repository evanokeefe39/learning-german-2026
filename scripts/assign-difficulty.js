const fs = require('fs');
const path = require('path');

// Load frequency data from all chapters
const freqDir = path.join(__dirname, '..', 'data', 'frequency');
const chapters = [1, 2, 3, 4, 5, 6, 7, 8];

// Aggregate noun and verb frequencies across all chapters
const nounFreq = {};
const verbFreq = {};
const nounChapters = {}; // track how many chapters a word appears in
const verbChapters = {};

for (const ch of chapters) {
  const data = JSON.parse(fs.readFileSync(path.join(freqDir, `chapter${ch}.json`), 'utf8'));

  for (const [word, count] of Object.entries(data.nouns || {})) {
    nounFreq[word] = (nounFreq[word] || 0) + count;
    nounChapters[word] = (nounChapters[word] || 0) + 1;
  }

  for (const [word, count] of Object.entries(data.verbs || {})) {
    verbFreq[word] = (verbFreq[word] || 0) + count;
    verbChapters[word] = (verbChapters[word] || 0) + 1;
  }
}

// Load current vocab data
const nounsPath = path.join(__dirname, '..', 'vocab-tester-app', 'data', 'nouns.json');
const verbsPath = path.join(__dirname, '..', 'vocab-tester-app', 'data', 'verbs.json');
const nouns = JSON.parse(fs.readFileSync(nounsPath, 'utf8'));
const verbs = JSON.parse(fs.readFileSync(verbsPath, 'utf8'));

// Calculate total frequency for each noun and verb
const nounScores = nouns.map(n => ({
  word: n.german,
  freq: nounFreq[n.german] || 0,
  chapters: nounChapters[n.german] || 0
}));

const verbScores = verbs.map(v => ({
  word: v.infinitive,
  freq: verbFreq[v.infinitive] || 0,
  chapters: verbChapters[v.infinitive] || 0
}));

// Sort by frequency to find tercile boundaries
const nounFreqs = nounScores.map(n => n.freq).sort((a, b) => a - b);
const verbFreqs = verbScores.map(v => v.freq).sort((a, b) => a - b);

function getTercileBoundaries(sortedFreqs) {
  const n = sortedFreqs.length;
  const t1 = sortedFreqs[Math.floor(n / 3)];
  const t2 = sortedFreqs[Math.floor(2 * n / 3)];
  return { t1, t2 };
}

const nounBounds = getTercileBoundaries(nounFreqs);
const verbBounds = getTercileBoundaries(verbFreqs);

function assignDifficulty(freq, bounds) {
  if (freq <= bounds.t1) return 'hard';
  if (freq <= bounds.t2) return 'medium';
  return 'easy';
}

// Add difficulty and frequency to nouns
for (const noun of nouns) {
  const freq = nounFreq[noun.german] || 0;
  const chapCount = nounChapters[noun.german] || 0;
  noun.frequency = freq;
  noun.chapterSpread = chapCount;
  noun.difficulty = assignDifficulty(freq, nounBounds);
}

// Add difficulty and frequency to verbs
for (const verb of verbs) {
  const freq = verbFreq[verb.infinitive] || 0;
  const chapCount = verbChapters[verb.infinitive] || 0;
  verb.frequency = freq;
  verb.chapterSpread = chapCount;
  verb.difficulty = assignDifficulty(freq, verbBounds);
}

// Write updated files
fs.writeFileSync(nounsPath, JSON.stringify(nouns, null, 2) + '\n');
fs.writeFileSync(verbsPath, JSON.stringify(verbs, null, 2) + '\n');

// Print stats
console.log('=== NOUN DIFFICULTY DISTRIBUTION ===');
console.log(`Tercile boundaries: hard <= ${nounBounds.t1}, medium <= ${nounBounds.t2}, easy > ${nounBounds.t2}`);
const nounDist = { easy: 0, medium: 0, hard: 0 };
for (const n of nouns) nounDist[n.difficulty]++;
console.log(`Easy: ${nounDist.easy}, Medium: ${nounDist.medium}, Hard: ${nounDist.hard}`);
console.log(`Total: ${nouns.length}`);

console.log('\n=== VERB DIFFICULTY DISTRIBUTION ===');
console.log(`Tercile boundaries: hard <= ${verbBounds.t1}, medium <= ${verbBounds.t2}, easy > ${verbBounds.t2}`);
const verbDist = { easy: 0, medium: 0, hard: 0 };
for (const v of verbs) verbDist[v.difficulty]++;
console.log(`Easy: ${verbDist.easy}, Medium: ${verbDist.medium}, Hard: ${verbDist.hard}`);
console.log(`Total: ${verbs.length}`);

console.log('\n=== SAMPLE EASY NOUNS ===');
nouns.filter(n => n.difficulty === 'easy').slice(0, 10).forEach(n =>
  console.log(`  ${n.german}: freq=${n.frequency}, chapters=${n.chapterSpread}`));

console.log('\n=== SAMPLE HARD NOUNS ===');
nouns.filter(n => n.difficulty === 'hard').slice(0, 10).forEach(n =>
  console.log(`  ${n.german}: freq=${n.frequency}, chapters=${n.chapterSpread}`));

console.log('\n=== SAMPLE EASY VERBS ===');
verbs.filter(v => v.difficulty === 'easy').slice(0, 10).forEach(v =>
  console.log(`  ${v.infinitive}: freq=${v.frequency}, chapters=${v.chapterSpread}`));

console.log('\n=== SAMPLE HARD VERBS ===');
verbs.filter(v => v.difficulty === 'hard').slice(0, 10).forEach(v =>
  console.log(`  ${v.infinitive}: freq=${v.frequency}, chapters=${v.chapterSpread}`));
