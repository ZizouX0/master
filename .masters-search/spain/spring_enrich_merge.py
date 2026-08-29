#!/usr/bin/env python3
"""Merge the wave-6 enrichment batches onto the spring-intake dataset.

The join is two-hop and that is deliberate. The enrichment agents were handed a
*canonical* institution name (UPC's six schools collapsed to one, VIU's two
spellings reconciled), because asking eight agents to price "UPC" six times over
would have wasted a batch. The spring CSV still carries the raw, per-source
institution string. The batch-input files are the only place both spellings sit
on the same row, so they are the bridge: enrichment -> batch input -> spring CSV.
"""
import csv, glob, json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPRING = os.path.join(ROOT, "output", "spring-intakes.csv")
ENRICH = os.path.join(ROOT, "output", "spring", "enrich")
OUT    = os.path.join(ROOT, "output", "spring-intakes-enriched.csv")

NEW_COLS = ["city", "autonomous_community", "campus", "university_awarding",
            "institution_type", "meces_level", "eqf_level", "europe_recognition",
            "diploma_supplement", "phd_access", "tuition_eu_eur",
            "tuition_non_eu_eur", "tuition_year_of_rates", "fees_extra_eur",
            "boe_order", "ruct_url", "enriched_official_status", "enrichment_sources"]


def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def tri(s):
    s = " " + re.sub(r"\s+", " ", fold(s)) + " "
    return {s[i:i + 3] for i in range(max(len(s) - 2, 1))}


def similar(a, b):
    """Trigram overlap. The dataset carries the same UPC master under both its
    Catalan and its Spanish name ('Tecnologies Avancades de Telecomunicacio' vs
    'Tecnologias Avanzadas de Telecomunicacion'), so an exact folded match drops
    real rows on the floor. Trigrams survive the orthography swap; a hand-written
    ca/es dictionary would only survive the pairs I happened to think of."""
    x, y = tri(a), tri(b)
    return len(x & y) / max(len(x | y), 1)


def flat(v):
    """Agents returned `sources` as a bare string, a list of strings, and a list
    of {label,url} dicts. Take all three; a URL that vanishes is evidence lost."""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return " ".join(str(x) for x in v.values() if x)
    if isinstance(v, list):
        return " | ".join(flat(x) for x in v if x)
    return "" if v is None else str(v)


# Rows that describe an institution's calendar rather than a named programme.
# They earned their place in the sweep (they are how the February windows were
# found) but there is no single degree to price or locate, so they are reported
# apart instead of being silently dropped.
CALENDAR = ("institution-wide", "preinscripci")


def is_calendar(row):
    n = (row.get("programme_name") or "").lower()
    return any(k in n for k in CALENDAR)


def yes(v):
    """A spring verdict counts when it OPENS with yes -- 'YES, but only for the
    online track' is a yes; 'NO -- the January date is an application deadline'
    opens with no and must not be swept in by a bare substring test."""
    return fold(v).startswith("yes")


def load_inputs():
    """canonical (institution, programme) -> list of raw institution prefixes."""
    bridge = {}
    for path in sorted(glob.glob(os.path.join(ENRICH, "batch-*-input.jsonl"))):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            key = (fold(r.get("institution")), fold(r.get("programme_name")))
            bridge.setdefault(key, []).append(r.get("institution_raw") or "")
    return bridge


def load_enrichment():
    recs, dupes = [], []
    for path in sorted(glob.glob(os.path.join(ENRICH, "batch-*.jsonl"))):
        if path.endswith("-input.jsonl"):
            continue
        for n, line in enumerate(open(path, encoding="utf-8"), 1):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError as e:
                print("  ! unparseable %s:%d  %s" % (os.path.basename(path), n, e))
                continue
            recs.append(r)
    return recs, dupes


def head(name):
    """The institution's name, before the description that follows it.

    Both passes wrote 'EUDE Business School' and then went their own way --
    '..., Madrid -- private business school' against '... (Escuela Europea de
    Direccion y Empresa)'. Neither string is a prefix of the other and they
    share too few trigrams to pass, so the name they agree on has to be cut out
    before comparing."""
    return fold(re.split(r"[,(\u2014\u2013|]", name or "")[0])


def segments(name):
    """A programme name, plus each side of any '/' it is written across."""
    # Split on the separators agents actually used to join two names: a slash
    # between languages, an em dash after an acronym ("MASTEAM -- Master's
    # degree in ..."), a colon before a subtitle.
    parts = [name] + [p for p in re.split(r"\s*[/\u2014:]\s*", name or "")
                      if len(p.strip()) > 8]
    return [fold(p) for p in parts if fold(p)]


def resolve(bridge, inst, prog, floor=0.55):
    """Best batch key for a free-text (institution, programme) pair, or None.

    Used for BOTH sides of the join. The spring CSV and the agents' output were
    written by different passes that truncated and re-typed these strings
    independently -- 'Master en Big Data y Cloud Computing' against
    'Master en Big Data y Cloud Computing (also a sibling Ma', and so on. Two
    different matchers here would mean a row and its own enrichment resolving to
    two different keys, which is the quiet way to lose data."""
    inst, prog = fold(inst), fold(prog)
    best, score = None, 0.0
    for key, val in bridge.items():
        ci, cp = key
        if isinstance(val, tuple):
            names, progs = val
        else:
            names, progs = [ci] + [fold(r) for r in val if r], [cp]
        # Institution match is SCORED, never boolean, and the two scores are
        # multiplied. Three different universities each run a "Master
        # Universitario en Ciberseguridad": on programme name alone all three
        # score 1.0, so whichever key the dict happened to yield first won and
        # the other two universities' masters were silently absorbed into it.
        isc = 0.0
        hi = head(inst)
        for n in list(names) + [head(x) for x in names]:
            if hi and n and (hi == n or hi.startswith(n) or n.startswith(hi)) \
               and min(len(hi), len(n)) >= 8:
                isc = max(isc, 0.9)
        for n in names:
            if inst == n:
                isc = max(isc, 1.0)
            elif inst.startswith(n) or n.startswith(inst):
                isc = max(isc, 0.95)
            else:
                isc = max(isc, similar(n, inst))
                # Containment is the delivery-partner case ('UCJC -- delivered
                # with ISEMCO'). Scored low on purpose: it must win only when
                # nothing better is on offer.
                if (len(inst) >= 6 and inst[:20] in n) or (len(n) >= 6 and n[:20] in inst):
                    isc = max(isc, 0.45)
        if isc < 0.45:
            continue
        # Many UPC rows carry the degree under both names at once --
        # "Master Universitari en Enginyeria Electronica / Master's degree in
        # Electronic Engineering". Trigrams cannot bridge Catalan to English
        # (they share almost no letters), but the slash already tells us these
        # are the same degree, so score each side and keep the better.
        psc = 0.0
        cands = [x for pn in progs for x in segments(pn)]
        for a in segments(prog):
            for c in cands:
                if a == c or c.startswith(a) or a.startswith(c):
                    psc = 1.0
                else:
                    psc = max(psc, similar(c, a))
        if psc * isc > score:
            best, score = (ci, cp), psc * isc
    return best if score >= floor * 0.45 else None


def main():
    bridge = load_inputs()
    raw_enr, dupes = load_enrichment()
    enr, orphan_enr = {}, []
    for r in raw_enr:
        key = resolve(bridge, r.get("institution"), r.get("programme_name"))
        if key is None:
            orphan_enr.append(r)
        elif key in enr:
            dupes.append(key)
        else:
            enr[key] = r
    print("batch inputs: %d  enrichment records: %d  duplicate keys: %d"
          % (len(bridge), len(enr), len(dupes)))

    with open(SPRING, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    header = list(rows[0].keys())

    # canonical key -> the spring rows it covers
    by_key, calendar = {}, []
    for row in rows:
        if not yes(row.get("spring_intake", "")):
            continue
        if is_calendar(row):
            calendar.append(row)
            continue
        hit = resolve(bridge, row.get("institution"), row.get("programme_name"))
        by_key.setdefault(hit, []).append(row)

    unmatched = by_key.pop(None, [])

    # Widen the bridge with the strings the spring sweep itself used, then run
    # the enrichment records through again. The batch inputs were meant to be
    # the bridge, but they carry only ONE spelling per programme; an agent that
    # echoed the sweep's wording instead of the batch's had nothing to match on
    # and its whole record -- fees, campus, recognition -- fell out silently.
    wide = {}
    for key, group in by_key.items():
        raws = bridge.get(key, [])
        # Store the head alongside the full string: fold() strips the commas and
        # dashes head() cuts on, so a head computed later inside resolve() would
        # be a no-op on an already-folded name.
        insts = {key[0]} | {fold(r) for r in raws if r} | {head(r) for r in raws if r} \
                | {fold(g["institution"]) for g in group} \
                | {head(g["institution"]) for g in group}
        progs = {key[1]} | {g["programme_name"] for g in group}
        wide[key] = (sorted(i for i in insts if i), sorted(progs))
    recovered = 0
    for r in list(orphan_enr):
        key = resolve(wide, r.get("institution"), r.get("programme_name"))
        if key and key not in enr:
            enr[key] = r
            orphan_enr.remove(r)
            recovered += 1
    if recovered:
        print("  recovered %d enrichment record(s) via spring-row aliases" % recovered)
    for r in orphan_enr:
        print("  ! STILL orphaned: %s / %s"
              % (r.get("institution", "")[:40], r.get("programme_name", "")[:55]))
    print("institution-wide calendar rows held back: %d" % len(calendar))
    for r in calendar:
        print("      ~ %s / %s" % (r["institution"][:40], r["programme_name"][:60]))
    print("spring YES rows matched to a batch key: %d across %d programmes"
          % (sum(len(v) for v in by_key.values()), len(by_key)))
    if unmatched:
        print("  ! %d YES rows matched no batch key:" % len(unmatched))
        for r in unmatched[:20]:
            print("      %s / %s" % (r["institution"][:45], r["programme_name"][:55]))

    out, filled, missing = [], 0, []
    for key, group in sorted(by_key.items()):
        # one output row per programme: keep the richest source row
        base = max(group, key=lambda r: sum(len(v or "") for v in r.values()))
        e = enr.get(key)
        rec = dict(base)
        if e:
            filled += 1
            for c in NEW_COLS:
                if c == "enriched_official_status":
                    rec[c] = e.get("official_status", "")
                elif c == "enrichment_sources":
                    rec[c] = flat(e.get("sources", ""))
                else:
                    rec[c] = flat(e.get(c, ""))
            # the enrichment pass re-read the source pages, so where it names a
            # RUCT code and the spring sweep left the field empty, take it
            if e.get("ruct_code") and not (base.get("ruct_code") or "").strip():
                rec["ruct_code"] = e["ruct_code"]
        else:
            for c in NEW_COLS:
                rec[c] = ""
            missing.append((base["institution"][:40], base["programme_name"][:55]))
        rec["_rows_merged"] = str(len(group))
        out.append(rec)

    print("programmes with enrichment: %d   still awaiting: %d" % (filled, len(missing)))
    for m in missing:
        print("      - %s / %s" % m)

    cols = header + NEW_COLS + ["_rows_merged"]
    with open(OUT, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in out:
            w.writerow({c: r.get(c, "") for c in cols})
    print("wrote %s  (%d programmes, %d columns)" % (OUT, len(out), len(cols)))


if __name__ == "__main__":
    main()
