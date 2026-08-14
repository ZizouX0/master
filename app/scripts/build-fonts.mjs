#!/usr/bin/env node
/**
 * build-fonts.mjs — the three faces of The Desk, subset from upstream, reproducibly.
 *
 *   node scripts/build-fonts.mjs            build src/fonts/*.woff2 + metrics.json
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
 *     that will actually be set in it. The table is written to src/fonts/metrics.json and
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
const OUT = join(ROOT, 'src', 'fonts');
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

// ── codepoints, and the corpus the metrics are measured over ─────────────────

/** Every character the app can render. This drives the SUBSET. */
function codepointsInData() {
  const chars = new Set();
  const files = ['index.json', 'meta.json', 'detail.json', 'funding.json'];
  for (const name of files) {
    const file = join(DATA, name);
    if (!existsSync(file)) throw new Error(`missing public/data/${name} — run "npm run data" first`);
    const stack = [JSON.parse(readFileSync(file, 'utf8'))];
    while (stack.length) {
      const v = stack.pop();
      if (typeof v === 'string') {
        for (const ch of v) chars.add(ch);
      } else if (Array.isArray(v)) {
        stack.push(...v);
      } else if (v && typeof v === 'object') {
        stack.push(...Object.keys(v), ...Object.values(v));
      }
    }
  }
  for (let cp = 0x20; cp <= 0x7e; cp++) chars.add(String.fromCodePoint(cp));
  for (const ch of UI_GLYPHS) chars.add(ch);
  return chars;
}

/**
 * The fields that are actually SET in the reading face — the app's own argument, in its own
 * words. This drives the METRICS, and it is deliberately not the same set as the subset above.
 *
 * Weighting the mean advance over every string in the JSON (keys, URLs, enum values, the raw
 * `url` citation lists) measures a text nobody reads: it came out 2.0% wide for Literata against
 * the same font measured on real prose, which is a whole line every 50, and the swap would move
 * the page. The subset must contain every codepoint the data can produce; the metric must
 * describe the sentences a human will read.
 */
const PROSE_FIELDS = [
  'verdictWhy', 'acceptsNonMusic', 'portfolio', 'recommendation', 'entry', 'study',
  'correction', 'scholarshipDetail', 'whyChance', 'qualification', 'accreditation',
  'programme', 'institution',
];

function proseCorpus(keep) {
  const out = [];
  for (const name of ['detail.json', 'index.json']) {
    const file = join(DATA, name);
    if (!existsSync(file)) continue;
    const stack = [JSON.parse(readFileSync(file, 'utf8'))];
    while (stack.length) {
      const v = stack.pop();
      if (Array.isArray(v)) stack.push(...v);
      else if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v)) {
          if (typeof val === 'string') {
            if (PROSE_FIELDS.includes(k) && val.length > 12) out.push(val);
          } else stack.push(val);
        }
      }
    }
  }
  // Only what the subset can actually render: a Greek institution name falls to the system
  // stack, so it must not move a number that describes our own faces.
  return [...out.join(' ')].filter((ch) => keep.has(ch)).join('').slice(0, 40000);
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

/** Glyphs in the shipped file. fontTools reads woff2 directly; HarfBuzz does not. */
function glyphCount(woff2) {
  return Number(
    py(['-c', "import sys;from fontTools.ttLib import TTFont;print(len(TTFont(sys.argv[1]).getGlyphOrder()))", woff2]).trim()
  );
}

/**
 * Mean advance in em over that corpus, SHAPED — not summed.
 *
 * Summing `hmtx` advances ignores kerning, and Literata kerns hard: over 12,000 characters of
 * this app's prose the sum said 1.0737× Liberation Sans where the browser laid out 1.0620×, a
 * 1.1% error on its own. Shaping with HarfBuzz — the same shaper Chromium uses — reproduces the
 * browser to four decimal places (verified: 1.0620 and 0.9856 against a live measurement in
 * Chromium 141). The vertical metrics come from hhea, which is what the browser uses for the
 * line box; every face here sets hhea and OS/2 typo to the same values, so there is nothing to
 * disambiguate.
 *
 * Measured on the axis-clipped TTF rather than the woff2: HarfBuzz does not decompress woff2,
 * and woff2 is lossless, so the advances are identical.
 */
function measure(fontPath, corpusFile, variations) {
  const script = `
import json, sys
from fontTools.ttLib import TTFont
try:
    import uharfbuzz as hb
except ImportError:
    hb = None

path, corpus_file, var_json = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(corpus_file, encoding='utf8').read()
variations = json.loads(var_json)

f = TTFont(path, fontNumber=0)
upem = f['head'].unitsPerEm
cmap = f.getBestCmap()
hhea = f['hhea']
missing = sorted({hex(ord(c)) for c in text if cmap.get(ord(c)) is None})

if hb is not None:
    face = hb.Face(hb.Blob.from_file_path(path))
    font = hb.Font(face)
    if variations:
        font.set_variations(variations)
    total = 0
    for i in range(0, len(text), 2000):
        buf = hb.Buffer()
        buf.add_str(text[i:i + 2000])
        buf.guess_segment_properties()
        hb.shape(font, buf, {'kern': True, 'liga': True, 'calt': True})
        total += sum(p.x_advance for p in buf.glyph_positions)
    avg = total / face.upem / len(text)
    shaped = True
else:
    hmtx = f['hmtx']
    total = n = 0
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None:
            continue
        total += hmtx[g][0]
        n += 1
    avg = total / n / upem
    shaped = False

print(json.dumps({
    'upem': upem,
    'avgAdvance': avg,
    'shaped': shaped,
    'ascent': hhea.ascent / upem,
    'descent': abs(hhea.descent) / upem,
    'lineGap': hhea.lineGap / upem,
    'xHeight': getattr(f['OS/2'], 'sxHeight', 0) / upem,
    'capHeight': getattr(f['OS/2'], 'sCapHeight', 0) / upem,
    'glyphs': len(f.getGlyphOrder()),
    'missing': missing[:20],
}))
`;
  return JSON.parse(py(['-c', script, fontPath, corpusFile, JSON.stringify(variations ?? {})]));
}

// ── build ────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(TMP, { recursive: true });

  const all = codepointsInData();
  const keep = new Set([...all].filter((ch) => LATIN_ONLY(ch.codePointAt(0))));
  const dropped = [...all].filter((ch) => !LATIN_ONLY(ch.codePointAt(0)));

  writeFileSync(
    join(TMP, 'unicodes.txt'),
    [...keep].map((ch) => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join('\n')
  );
  const corpusFile = join(TMP, 'corpus.txt');
  const corpus = proseCorpus(keep);
  writeFileSync(corpusFile, corpus);

  console.log(`codepoints: ${keep.size} kept · ${dropped.length} dropped to the system stack`);
  console.log(`  dropped: ${dropped.join('')}`);
  console.log(`metric corpus: ${corpus.length} characters of the app's own prose\n`);

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
    report.fallbacks[fb.id] = { label: fb.label, ...measure(src, corpusFile, fb.instance) };
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
    // The clipped TTF, not the woff2: HarfBuzz cannot read woff2, and woff2 is lossless.
    const m = measure(clipped, corpusFile, face.instance);
    m.glyphs = glyphCount(woff2);
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
    // The canvas is a laptop, so the fallback that will actually paint is Arial or Helvetica,
    // not Roboto. Arial is the reference the shipped table is computed against; the Roboto
    // number is reported beside it as the Android case, and the two differ by ~1%.
    const ref = f.role === 'mono' ? report.fallbacks.mono : report.fallbacks.arial;
    const alt = f.role === 'mono' ? report.fallbacks.mono : report.fallbacks.roboto;
    if (!ref) continue;
    const sizeAdjust = f.avgAdvance / ref.avgAdvance;
    const sizeAdjustAlt = alt ? f.avgAdvance / alt.avgAdvance : sizeAdjust;
    report.overrides[id] = {
      against: ref.label,
      sizeAdjust: pct(sizeAdjust),
      sizeAdjustOnAndroid: pct(sizeAdjustAlt),
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
        `  descent ${o.descentOverride.padStart(6)}  [vs ${o.against}; Roboto/Android side ${o.sizeAdjustOnAndroid}]`
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
    console.error('no src/fonts/metrics.json — run without --check first');
    process.exit(1);
  }
  verifyStyles(JSON.parse(readFileSync(file, 'utf8')));
} else {
  await main();
}
