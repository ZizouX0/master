#!/usr/bin/env node
/**
 * build-fonts.mjs — the three faces of The Desk, subset from upstream, reproducibly.
 *
 *   node scripts/build-fonts.mjs            build public/fonts/*.woff2 + metrics.json
 *   node scripts/build-fonts.mjs --check    rebuild nothing; verify styles.css still agrees
 *                                           with the computed metric-override table
 *
 * Why this is a script and not four files someone once exported by hand: the codepoint set is
 * *derived from the data*, and the data changes on every research pass. A hand-made subset rots
 * silently — the first Turkish institution name with a ğ in it renders in DejaVu and nobody
 * notices for a month.
 *
 * Three things this does that a naive subset does not:
 *
 *  1. **It clips the variable axes before it subsets glyphs**, because that is where the bytes
 *     are. Literata carries an `opsz` axis from 7 to 72 and a `wght` axis from 200 to 900;
 *     the app uses one optical size and three weights. Measured on this box:
 *     101,592 B unclipped → 28,024 B with `opsz` pinned at 14 and `wght` clipped to 400–700.
 *     Glyph subsetting alone gets nowhere near that.
 *
 *  2. **It computes the metric-override table from the built files**, rather than copying
 *     numbers out of a document. `size-adjust` is the ratio of the webfont's mean advance to
 *     the fallback's mean advance — and the mean is weighted by *this app's own character
 *     frequencies*, not measured over one sample sentence, so the number is right for the text
 *     that will actually be set in it. The table is written to public/fonts/metrics.json and
 *     `--check` fails if src/styles.css has drifted from it.
 *
 *  3. **It leaves Greek and Cyrillic out on purpose.** The data carries 113 of them
 *     (Ωδείο, аудиограм) and every one appears inside a quoted raw string, which is set in the
 *     mono face and is allowed to fall through to the system stack. A Greek + Cyrillic subset
 *     of all three faces costs more than those nine records are worth.
 *
 * Requires: python3 with `fonttools` and `brotli` (pip install fonttools brotli).
 * Network: fetches the upstream variable TTFs from google/fonts (cached in scripts/.font-cache).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = join(ROOT, 'public', 'data');
const OUT = join(ROOT, 'public', 'fonts');
const CACHE = join(ROOT, 'scripts', '.font-cache');
const TMP = join(CACHE, 'tmp');
const CHECK = process.argv.includes('--check');

const RAW = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

/**
 * The shipped faces. `axes` is passed to fontTools' varLib.instancer: `tag=value` pins the axis
 * and removes it, `tag=min:default:max` clips it and keeps it. Every kept axis is one the CSS
 * actually varies — Archivo keeps `wdth` because the section legends are set at 115 and the
 * verdict word at 125, which is the entire reason that family was chosen.
 */
const FACES = [
  {
    id: 'literata-body',
    family: 'Literata',
    url: `${RAW}/literata/Literata%5Bopsz,wght%5D.ttf`,
    // opsz 14 is the reading size this app is set at (16.5px prose, 21px titles). Pinning it
    // rather than shipping the axis is worth ~70 KB and the app never animates optical size.
    axes: ['opsz=14', 'wght=400:400:700'],
    style: 'normal',
    role: 'body',
    fallbackKind: 'proportional',
  },
  {
    id: 'literata-italic',
    family: 'Literata',
    url: `${RAW}/literata/Literata-Italic%5Bopsz,wght%5D.ttf`,
    // Italic is a separate file — variable fonts do not interpolate to italic. It is worth its
    // bytes here because the block quote (their voice) and the card sentence are both italic,
    // and italic is how this design says "these are their words, not ours".
    // Pinned static at 400: the type scale sets italic at one weight and only one, and shipping
    // the axis for weights no rule requests costs 15 KB — a seventh of the whole budget.
    axes: ['opsz=14', 'wght=400'],
    style: 'italic',
    role: 'body',
    fallbackKind: 'proportional',
  },
  {
    id: 'archivo-legend',
    family: 'Archivo',
    url: `${RAW}/archivo/Archivo%5Bwdth,wght%5D.ttf`,
    // wdth is clipped at 100, not the family's 62: the scale sets legends at 110–115 and the
    // verdict word at 125, and never goes below 100. Carrying the condensed half of the axis
    // costs 17 KB for widths no rule in styles.css asks for.
    axes: ['wght=400:400:700', 'wdth=100:100:125'],
    style: 'normal',
    role: 'legend',
    fallbackKind: 'proportional',
  },
  {
    id: 'spline-mono',
    family: 'Spline Sans Mono',
    url: `${RAW}/splinesansmono/SplineSansMono%5Bwght%5D.ttf`,
    axes: ['wght=400:400:500'],
    style: 'normal',
    role: 'mono',
    fallbackKind: 'mono',
  },
];

/** Measured against, never shipped. Roboto is the Android default; Arial is everything else. */
const FALLBACKS = [
  { id: 'roboto', label: 'Roboto (Android)', url: `${RAW}/roboto/Roboto%5Bwdth,wght%5D.ttf`, axes: ['wght=400', 'wdth=100'] },
  { id: 'arial', label: 'Arial metrics (Liberation Sans)', file: '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf' },
  { id: 'mono', label: 'ui-monospace (Liberation Mono)', file: '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf' },
];

/**
 * Glyphs the *interface* needs that the data does not contain. Kept as an explicit list rather
 * than scraped out of the source, because scraping the source also drags in every box-drawing
 * character used to rule off a comment block.
 */
const UI_GLYPHS = '€£$—–…‘’“”„·×→←↑↓↔≈≤≥±°%§¶†‡•✓✔✕▲▾▸◆◇◉○●◐★☆⚙⊘≡‹›«»©²³º№';

const LATIN_ONLY = (cp) =>
  cp < 0x0370 || // ASCII, Latin-1, Latin Extended-A/B, IPA, spacing modifiers, combining marks
  (cp >= 0x1e00 && cp <= 0x1eff) || // Latin Extended Additional (Vietnamese, Ẽ Ữ)
  (cp >= 0x2000 && cp <= 0x206f) || // general punctuation
  (cp >= 0x20a0 && cp <= 0x20bf) || // currency (€ ₺)
  (cp >= 0x2100 && cp <= 0x25ff) || // letterlike, arrows, math, geometric shapes
  (cp >= 0x2600 && cp <= 0x27bf); // misc symbols + dingbats (✓ ✕ ⚙)

// ── codepoints ───────────────────────────────────────────────────────────────

/** Every character the app can render, with how often it occurs. Frequency drives the metrics. */
function codepointFrequencies() {
  const freq = new Map();
  const files = ['index.json', 'meta.json', 'detail.json', 'funding.json'];
  for (const name of files) {
    const file = join(DATA, name);
    if (!existsSync(file)) throw new Error(`missing public/data/${name} — run "npm run data" first`);
    const stack = [JSON.parse(readFileSync(file, 'utf8'))];
    while (stack.length) {
      const v = stack.pop();
      if (typeof v === 'string') {
        for (const ch of v) freq.set(ch, (freq.get(ch) ?? 0) + 1);
      } else if (Array.isArray(v)) {
        stack.push(...v);
      } else if (v && typeof v === 'object') {
        stack.push(...Object.keys(v), ...Object.values(v));
      }
    }
  }
  // The interface's own furniture, and the printable ASCII the UI is built from, at weight 0 —
  // present in the subset, absent from the frequency weighting so they cannot skew the metrics.
  for (let cp = 0x20; cp <= 0x7e; cp++) if (!freq.has(String.fromCodePoint(cp))) freq.set(String.fromCodePoint(cp), 0);
  for (const ch of UI_GLYPHS) if (!freq.has(ch)) freq.set(ch, 0);
  freq.set(' ', 0);
  return freq;
}

// ── shell helpers ────────────────────────────────────────────────────────────

const py = (args) => execFileSync('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

async function download(url, to) {
  if (existsSync(to)) return to;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  writeFileSync(to, Buffer.from(await res.arrayBuffer()));
  return to;
}

/**
 * Mean advance width in em, weighted by this app's character frequencies, plus the vertical
 * metrics the browser will actually use for the line box (hhea; every face here sets hhea and
 * OS/2 typo to the same values, so there is no ambiguity to resolve).
 */
function measure(fontPath, freq) {
  const script = `
import json, sys
from fontTools.ttLib import TTFont
f = TTFont(sys.argv[1], fontNumber=0)
freq = json.load(open(sys.argv[2], encoding='utf8'))
upem = f['head'].unitsPerEm
cmap = f.getBestCmap()
hmtx = f['hmtx']
num = den = 0.0
missing = []
for ch, w in freq.items():
    cp = ord(ch)
    g = cmap.get(cp)
    if g is None:
        if w: missing.append(hex(cp))
        continue
    if w:
        num += hmtx[g][0] * w
        den += w
hhea = f['hhea']
print(json.dumps({
    'upem': upem,
    'avgAdvance': (num / den / upem) if den else 0,
    'ascent': hhea.ascent / upem,
    'descent': abs(hhea.descent) / upem,
    'lineGap': hhea.lineGap / upem,
    'xHeight': getattr(f['OS/2'], 'sxHeight', 0) / upem,
    'capHeight': getattr(f['OS/2'], 'sCapHeight', 0) / upem,
    'glyphs': len(f.getGlyphOrder()),
    'missing': missing[:20],
}))
`;
  const freqFile = join(TMP, 'freq.json');
  return JSON.parse(py(['-c', script, fontPath, freqFile]));
}

// ── build ────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(TMP, { recursive: true });

  const freq = codepointFrequencies();
  const keep = [...freq.keys()].filter((ch) => LATIN_ONLY(ch.codePointAt(0)));
  const dropped = [...freq.keys()].filter((ch) => !LATIN_ONLY(ch.codePointAt(0)));

  // Weighting set = the kept characters only; a Greek glyph we do not ship must not move the mean.
  const weights = Object.fromEntries(keep.map((ch) => [ch, freq.get(ch)]));
  writeFileSync(join(TMP, 'freq.json'), JSON.stringify(weights));
  writeFileSync(
    join(TMP, 'unicodes.txt'),
    keep.map((ch) => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join('\n')
  );

  console.log(`codepoints: ${keep.length} kept · ${dropped.length} dropped to the system stack`);
  console.log(`  dropped: ${dropped.join('')}\n`);

  const report = { built: new Date().toISOString().slice(0, 10), faces: {}, fallbacks: {}, overrides: {} };

  // Fallback references first — the size-adjust denominators.
  for (const fb of FALLBACKS) {
    let src = fb.file;
    if (!src) {
      src = join(CACHE, `${fb.id}.ttf`);
      await download(fb.url, src);
      if (fb.axes) {
        const inst = join(TMP, `${fb.id}-inst.ttf`);
        py(['-m', 'fontTools.varLib.instancer', src, ...fb.axes, '-o', inst]);
        src = inst;
      }
    }
    if (!existsSync(src)) {
      console.warn(`  ! fallback ${fb.id} not available on this box — skipped`);
      continue;
    }
    report.fallbacks[fb.id] = { label: fb.label, ...measure(src, weights) };
  }

  for (const face of FACES) {
    const raw = join(CACHE, `${face.id}-upstream.ttf`);
    await download(face.url, raw);
    const clipped = join(TMP, `${face.id}-clipped.ttf`);
    const woff2 = join(OUT, `${face.id}.woff2`);

    // 1 · axis clip. Always before the glyph subset: instancing rewrites gvar/HVAR, and the
    //     saving compounds with the smaller glyph set rather than being undone by it.
    py(['-m', 'fontTools.varLib.instancer', raw, ...face.axes, '-o', clipped]);

    // 2 · glyph subset. `kern,liga,calt,tnum` and nothing else: onum/frac/ss01+ pull in whole
    //     alternate glyph sets for features no rule in styles.css turns on.
    py([
      '-m', 'fontTools.subset', clipped,
      `--unicodes-file=${join(TMP, 'unicodes.txt')}`,
      '--layout-features=kern,liga,calt,tnum',
      '--no-hinting',
      '--drop-tables+=DSIG',
      '--flavor=woff2',
      `--output-file=${woff2}`,
    ]);

    const upstreamBytes = statSync(raw).size;
    const bytes = statSync(woff2).size;
    const m = measure(woff2, weights);
    report.faces[face.id] = {
      family: face.family,
      style: face.style,
      role: face.role,
      axes: face.axes,
      upstreamBytes,
      bytes,
      ...m,
    };
    console.log(
      `${face.id.padEnd(16)} ${String(upstreamBytes).padStart(7)} → ${String(bytes).padStart(6)} B` +
        `  (${((1 - bytes / upstreamBytes) * 100).toFixed(1)}% off)  ${m.glyphs} glyphs` +
        `  avg ${m.avgAdvance.toFixed(4)} em`
    );
    if (m.missing.length) console.warn(`  ! no glyph for ${m.missing.join(' ')}`);
  }

  // ── the metric-override table ──────────────────────────────────────────────
  //
  // size-adjust scales the *fallback* so it occupies the width the real face will occupy:
  //     size-adjust      = avgAdvance(web) / avgAdvance(fallback)
  // and the ascent/descent overrides are divided by that same factor, because the browser
  // applies size-adjust on top of them:
  //     ascent-override  = ascent(web) / size-adjust
  //
  // (TECH-DECISION §3.5 prints this ratio the other way up — 92% for Literata against Roboto.
  //  That would shrink an already-narrower fallback. Literata is *wider* than Roboto, so the
  //  fallback has to grow. The browser measurement in FOUNDATION.md is the arbiter.)
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  for (const [id, f] of Object.entries(report.faces)) {
    const ref = f.role === 'mono' ? report.fallbacks.mono : report.fallbacks.roboto;
    const alt = f.role === 'mono' ? report.fallbacks.mono : report.fallbacks.arial;
    if (!ref) continue;
    const sizeAdjust = f.avgAdvance / ref.avgAdvance;
    const sizeAdjustAlt = alt ? f.avgAdvance / alt.avgAdvance : sizeAdjust;
    report.overrides[id] = {
      against: ref.label,
      sizeAdjust: pct(sizeAdjust),
      sizeAdjustVsAlt: pct(sizeAdjustAlt),
      ascentOverride: pct(f.ascent / sizeAdjust),
      descentOverride: pct(f.descent / sizeAdjust),
      lineGapOverride: pct(f.lineGap / sizeAdjust),
    };
  }

  const total = Object.values(report.faces).reduce((n, f) => n + f.bytes, 0);
  report.totalBytes = total;
  writeFileSync(join(OUT, 'metrics.json'), JSON.stringify(report, null, 2) + '\n');

  console.log(`\ntotal shipped: ${total} B (${(total / 1024).toFixed(1)} KB) — budget 120 KB\n`);
  console.log('metric-override table (paste into styles.css):');
  for (const [id, o] of Object.entries(report.overrides)) {
    console.log(
      `  ${id.padEnd(16)} size-adjust ${o.sizeAdjust.padStart(7)}  ascent ${o.ascentOverride.padStart(7)}` +
        `  descent ${o.descentOverride.padStart(6)}  [vs ${o.against}; Arial-side ${o.sizeAdjustVsAlt}]`
    );
  }

  if (total > 120 * 1024) {
    console.error(`\nFAIL: font payload ${total} B is over the 120 KB budget`);
    process.exitCode = 1;
  }
  verifyStyles(report);
  rmSync(TMP, { recursive: true, force: true });
}

/**
 * The table above is only worth computing if styles.css is actually using it. Every override
 * value must appear verbatim in the stylesheet, or the swap reflows and nobody finds out.
 */
function verifyStyles(report) {
  const css = readFileSync(join(ROOT, 'src', 'styles.css'), 'utf8');
  const want = [];
  for (const [id, o] of Object.entries(report.overrides)) {
    if (id === 'spline-mono') continue; // mono matches ui-monospace 1:1; no fallback face needed
    want.push([id, 'size-adjust', o.sizeAdjust], [id, 'ascent-override', o.ascentOverride], [id, 'descent-override', o.descentOverride]);
  }
  const missing = want.filter(([, prop, value]) => !css.includes(`${prop}: ${value}`));
  if (missing.length) {
    console.error('\nDRIFT: src/styles.css does not carry these computed values:');
    for (const [id, prop, value] of missing) console.error(`  ${id}: ${prop}: ${value};`);
    process.exitCode = 1;
  } else {
    console.log('\nstyles.css carries the computed override table. Zero-shift contract intact.');
  }
}

if (CHECK) {
  const file = join(OUT, 'metrics.json');
  if (!existsSync(file)) {
    console.error('no public/fonts/metrics.json — run without --check first');
    process.exit(1);
  }
  verifyStyles(JSON.parse(readFileSync(file, 'utf8')));
} else {
  await main();
}
