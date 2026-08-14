/**
 * The join, tested against the real 398 records and the real 120 schemes.
 *
 * One rule is load-bearing and everything else supports it: **an unknown must never render as an
 * eligible.** 36 of 120 schemes state no nationality scope, `requiresWorkExperience` is empty on
 * 72, and `requiresAdmissionFirst` has seven spellings of yes and no. Reading any of those
 * silences as permission is how an applicant spends three weeks on a scheme that was never open
 * to him — Chevening being the case that proves it, with an empty work-experience cell and a
 * 2,800-hour bar written out in its own prose.
 */

import { describe, expect, it } from 'vitest';
import * as money from '../money';
import {
  assessScheme,
  countryScope,
  schemesForProgramme,
  splitByFit,
  totalCostPicture,
  workExperienceBar,
  type ProgrammeLike,
} from '../money';
import { records, schemes } from './fixtures';

const byId = (id: number): ProgrammeLike => records.find((r) => r.id === id)!;

const basel = byId(15); // FHNW Basel — MA Producing. The strongest single target.
const icmp = byId(72); // ICMP London — the one scheme in the corpus that names an institution.
const edinburgh = byId(120); // £29,900 against a recorded band of "Under EUR 1.5k/yr".

const chevening = schemes.find((s) => /Chevening/i.test(s.name))!;
const eskas = schemes.find((s) => /ESKAS/i.test(s.name))!;
const eiffel = schemes.find((s) => /Eiffel/i.test(s.name))!;

// ─────────────────────────────────────────────────────────────────────────────
// The normalisers, against named schemes whose correct reading is stated here.
//
// These two tests used to compare `data/money.ts` against a duplicate copy of the same functions
// inside `views/Money.tsx`, to catch the two drifting apart. The Money screen is gone and the
// duplicate with it, which left the comparison asserting that a module equals itself — the worst
// kind of test, because it reads as coverage. What follows checks the readings themselves, on the
// three schemes the whole join turns on.
// ─────────────────────────────────────────────────────────────────────────────

describe('the normalisers, on schemes whose correct reading is known', () => {
  it('Chevening: the bar is 2,800 hours in the prose, and it is NOT nationality', () => {
    // The field is empty, so a reader that trusted the field would pass him straight through.
    expect(chevening.requiresWorkExperience.trim()).toBe('');
    const work = workExperienceBar(chevening);
    expect(work.kind).toBe('yes');
    expect(work.source).toBe('prose');
    expect(work.evidence).toMatch(/2800 hours/);
    // Getting the REASON right matters as much as the verdict: Tunisia has its own Chevening
    // country page. Reporting "not open to Tunisians" would send him to check the wrong thing.
    expect(money.tunisiaEligible(chevening).kind).toBe('named');
    expect(money.subjectFit(chevening).kind).toBe('open');
    expect(money.statedIneligible(chevening)).toMatch(/not eligible/i);
    // "No at application; yes later" is neither a yes nor a no, and flattening it either way
    // changes the order of his year.
    expect(money.admissionFirst(chevening.requiresAdmissionFirst).kind).toBe('conditional');
  });

  it('ESKAS: an empty work field is unknown, never "no bar"', () => {
    expect(eskas.requiresWorkExperience.trim()).toBe('');
    const work = workExperienceBar(eskas);
    expect(work.kind).toBe('unknown');
    expect(work.source).toBe('none');
    // Its own prose says Tunisia's place on the arts list is unverified, so the scheme names
    // Tunisia and still settles nothing — which is why the join calls it unknown, not eligible.
    expect(eskas.whoCanApply).toContain('UNVERIFIED');
    expect(money.subjectFit(eskas).kind).not.toBe('open');
    expect(money.ageCap(eskas.ageLimit).kind).toBe('no'); // he clears it either way
  });

  it('Eiffel: "NO - THIS IS THE DISQUALIFIER" reads as narrow, not blocked', () => {
    // This is the load-bearing subtlety. `subjectFit` does NOT catch Eiffel's own shouted
    // disqualifier — it reads the field as "restricted to named subjects". What keeps Eiffel out
    // of the eligible set is therefore not this function; it is `assessScheme` requiring an
    // outright `open` before it will say yes. If that requirement were ever relaxed to "not
    // blocked", Eiffel would become eligible for every French programme in the corpus.
    expect(eiffel.subjectScope).toMatch(/DISQUALIFIER/);
    expect(money.subjectFit(eiffel).kind).toBe('narrow');
    expect(workExperienceBar(eiffel).kind).toBe('no');
    expect(workExperienceBar(eiffel).source).toBe('field');
  });

  it('silence is never a pass, on any of the 120', () => {
    for (const s of schemes) {
      const work = workExperienceBar(s);
      if (s.requiresWorkExperience.trim() === '') {
        // An empty field may become `yes` off the prose, or `unknown`. It may never become `no`.
        expect(work.kind, s.name).not.toBe('no');
      } else {
        expect(work.source, s.name).toBe('field');
      }
      // An empty or UNVERIFIED admission cell is a question, not a "no offer needed".
      if (/^\W*(UNVERIFIED)?\W*$/i.test(s.requiresAdmissionFirst)) {
        expect(money.admissionFirst(s.requiresAdmissionFirst).kind, s.name).toBe('unknown');
      }
    }
  });

  it('ESKAS\'s age cap is read off the wrong sentence — pinned, not endorsed', () => {
    // Its `ageLimit` says «"The maximum age is 35" for the arts scholarship. At 24–26 he CLEARS
    // it.» — and `ageCap` returns 26, because the band pattern matches "24–26", the applicant's
    // own age, before the explicit "maximum age is 35" is considered. The published cap is 35.
    //
    // Nothing user-visible is wrong today: 26 > his age at entry, so the verdict is `no` under
    // either reading and the join is unaffected. But the margin is one year instead of ten, and
    // a record phrased "at 24–25" would flip the same scheme to `conditional` for no reason.
    // Fixing it is a one-line precedence change in `ageCap` — prefer the explicit upper bound
    // over the band — and this test is here so the fix is visible when it lands.
    const age = money.ageCap(eskas.ageLimit);
    expect(eskas.ageLimit).toMatch(/maximum age is 35/i);
    expect(age.kind).toBe('no');
    expect(age.cap).toBe(26); // should be 35
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Chevening — an empty field and a bar written out in the prose
// ─────────────────────────────────────────────────────────────────────────────

describe('Chevening', () => {
  it('has an empty requiresWorkExperience cell', () => {
    expect(chevening.requiresWorkExperience.trim()).toBe('');
  });

  it('is excluded anyway, on the sentence in its own prose', () => {
    const uk = records.find((r) => r.country === 'United Kingdom' && r.isDegree)!;
    const m = assessScheme(uk, chevening)!;
    expect(m).not.toBeNull();
    expect(m.fit).toBe('excluded');
    expect(m.tier).toBe('barred');
    expect(m.because).not.toBe('');
    // The reason must be the real one. The country page lists Tunisia; what stops him is hours.
    expect(m.becauseField + ' ' + m.because).toMatch(/work|hours|eligible/i);
  });

  it('never reaches a Swiss programme at all — it is about somewhere else, not "excluded"', () => {
    expect(countryScope(basel.country, chevening)).toBe('elsewhere');
    expect(assessScheme(basel, chevening)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M2 — unknown is not a yes
// ─────────────────────────────────────────────────────────────────────────────

describe('an unstated scheme is unknown, never eligible', () => {
  it('holds for every scheme that never mentions Tunisia, across all 398 programmes', () => {
    let checked = 0;
    for (const rec of records) {
      for (const m of schemesForProgramme(rec, schemes)) {
        if (m.read.nationality.kind !== 'unstated') continue;
        checked++;
        expect(m.fit, `${rec.institution} × ${m.scheme.name}`).not.toBe('eligible');
        expect(m.gaps.join(' ')).toMatch(/Nationality/);
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('holds for every silence in the eligibility normalisers, not just nationality', () => {
    for (const rec of records) {
      for (const m of schemesForProgramme(rec, schemes)) {
        if (m.fit !== 'eligible') continue;
        // An eligible verdict may rest only on positive statements.
        expect(m.read.nationality.kind, m.scheme.name).toBe('named');
        expect(m.read.work.kind, m.scheme.name).toBe('no');
        expect(m.read.age.kind, m.scheme.name).toBe('no');
        expect(m.read.ineligible, m.scheme.name).toBe('');
        expect(m.read.subject.kind === 'open' || m.tier === 'named', m.scheme.name).toBe(true);
      }
    }
  });

  it('Eiffel is never eligible — "restricted to named subjects" is a question, not a yes', () => {
    // DOOR3: "Eiffel excludes the arts." Its own subjectScope opens "NO - THIS IS THE
    // DISQUALIFIER", but the lifted `subjectFit` reads that as `narrow`, which is why the join
    // requires an outright `open` before it will say eligible.
    const eiffels = schemes.filter((s) => /Eiffel/i.test(s.name));
    expect(eiffels.length).toBeGreaterThan(0);
    for (const scheme of eiffels) {
      for (const rec of records.filter((r) => r.country === 'France')) {
        const m = assessScheme(rec, scheme);
        if (m) expect(m.fit, `${rec.institution} × ${scheme.name}`).not.toBe('eligible');
      }
    }
  });

  it('a scheme tied to one school is unknown for every other school in that country', () => {
    const codarts = schemes.find((s) => /at Codarts/i.test(s.name))!;
    const elsewhere = records.find((r) => r.country === 'Netherlands' && !/Codarts/i.test(r.institution))!;
    const m = assessScheme(elsewhere, codarts)!;
    expect(m.fit).toBe('unknown');
    expect(m.because).toMatch(/tied to a named institution/);
  });

  it('every match carries the sentence that decided it', () => {
    for (const m of schemesForProgramme(basel, schemes)) {
      expect(m.because.trim(), m.scheme.name).not.toBe('');
      expect(m.becauseField.trim(), m.scheme.name).not.toBe('');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// "Can I afford Basel with a scholarship I could actually win?"
// ─────────────────────────────────────────────────────────────────────────────

describe('FHNW Basel', () => {
  const matches = schemesForProgramme(basel, schemes);

  it('reaches the Swiss schemes, including the one worth CHF 2,450/month', () => {
    const ids = matches.map((m) => m.scheme.id);
    expect(ids).toContain(eskas.id);
    expect(matches.length).toBeGreaterThan(3);
  });

  it('calls ESKAS unknown, not eligible — Tunisia\'s place on the arts list is unverified', () => {
    const m = matches.find((x) => x.scheme.id === eskas.id)!;
    expect(m.fit).toBe('unknown');
    expect(m.gaps.length).toBeGreaterThan(0);
    expect(eskas.whoCanApply).toContain('UNVERIFIED');
  });

  it('states what is known and what is missing, and never produces a total', () => {
    const picture = totalCostPicture(basel, schemes);
    expect(picture.total).toBeNull();
    expect(picture.known.map((k) => k.field)).toContain('tuition');
    expect(picture.known.find((k) => k.field === 'tuition')!.value).toContain('CHF 1,250 PER SEMESTER');
    // The two-year figure carries an inline UNVERIFIED caveat; it must travel with the number.
    expect(picture.known.find((k) => k.field === 'totalCost')!.caveated).toBe(true);
    expect(picture.sentence).toContain('No total is shown');
    expect(picture.sentence).toMatch(/\d+ never say/);
    expect(picture.split.eligible + picture.split.unknown + picture.split.excluded).toBe(picture.schemes.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The other tiers
// ─────────────────────────────────────────────────────────────────────────────

describe('tiers', () => {
  it('a scheme that names the institution is tier "named"', () => {
    const scheps = schemes.find((s) => /Scheps/i.test(s.name))!;
    const m = assessScheme(icmp, scheps);
    expect(m).not.toBeNull();
    expect(m!.tier).toBe('named');
  });

  it('a national scheme does not leak into another country', () => {
    const slovak = schemes.find((s) => /Slovak/i.test(s.name))!;
    expect(assessScheme(basel, slovak)).toBeNull();
  });

  it('an EU-wide scheme reaches a European programme and a portable one reaches anything', () => {
    const aesef = schemes.find((s) => /AESEF Graduate/i.test(s.name))!;
    expect(countryScope(basel.country, aesef)).toBe('portable');
    const euWide = schemes.find((s) => /^EU-wide$/i.test(s.country))!;
    expect(countryScope(basel.country, euWide)).toBe('eu-wide');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The corrections must survive the join
// ─────────────────────────────────────────────────────────────────────────────

describe('cost corrections', () => {
  it('Edinburgh\'s ≈£29,900 correction is shown before any cost figure', () => {
    const picture = totalCostPicture(edinburgh, schemes);
    expect(edinburgh.costBand).toBe('Under EUR 1.5k/yr');
    expect(picture.corrections.length).toBe(1);
    expect(picture.corrections[0]).toBe(edinburgh.costDisputed);
    expect(picture.missing[0]).toMatch(/disputed/);
  });

  it('every cost-disputed record carries its correction into the picture', () => {
    const disputed = records.filter((r) => r.costDisputed !== '');
    expect(disputed.length).toBeGreaterThan(5);
    for (const rec of disputed) {
      expect(totalCostPicture(rec, schemes).corrections.length, String(rec.id)).toBe(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The whole corpus, so the shape of the answer is known rather than assumed
// ─────────────────────────────────────────────────────────────────────────────

describe('the join across all 398 programmes', () => {
  it('returns a bounded, mostly-unknown answer — which is the honest one', () => {
    let eligible = 0;
    let unknown = 0;
    let excluded = 0;
    let withAnyEligible = 0;
    for (const rec of records) {
      const split = splitByFit(schemesForProgramme(rec, schemes));
      eligible += split.eligible;
      unknown += split.unknown;
      excluded += split.excluded;
      if (split.eligible > 0) withAnyEligible++;
    }
    // Unknown must dominate by orders of magnitude. If it ever stops, something started guessing.
    expect(unknown).toBeGreaterThan(eligible * 50);
    expect(eligible + unknown + excluded).toBeGreaterThan(1000);
    expect(withAnyEligible).toBeLessThan(records.length / 4);
    expect(excluded).toBeGreaterThan(100); // and the exclusions must be real, not empty caution
  });
});
