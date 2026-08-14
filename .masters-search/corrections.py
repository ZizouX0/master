#!/usr/bin/env python3
"""Let a verifier's correction override a stale structured field.

The verification agents were told that a correction is worth more than a confirmation,
and they delivered: 75 of the 127 verified Door-3 records say a structured field is
wrong. But the corrections were only ever written into a prose column, so the machine
fields kept their original values — and the two then disagreed silently.

The dangerous cases are the ones that make something look *easier* than it is:

  Babelsberg 258/259/260  gate "Exam/interview only", cost "Free"
                          correction: the aptitude test's first part is a live piano
                          audition with interval and harmony identification
  FAMU 253/254            gate "Portfolio only" / "Exam/interview only", cost "Free"
                          correction: round two is a live performance audition plus
                          pitch-memory and rhythmic-dictation tests
  Edinburgh 120           cost "Under EUR 1.5k/yr" -> approximately GBP 29,900
  KASK 5                  cost "Under EUR 1.5k/yr" -> EUR 8,800.20

A filter for "free and no audition" returned all of those. This module finds them.

It does not attempt to parse the corrected number out of prose — that would invent
precision. It marks the field as disputed and hands the reader the sentence.
"""
import re

# a live performance or ear test, in the languages the corpus actually uses
RX_AUDITION = re.compile(
    r"live performance audition|performance audition|piano audition|instrumental audition|"
    r"live audition|audition is (?:required|mandatory)|functionally an audition|"
    r"ear[- ]training|ear test|aural (?:test|exam|aptitude)|"
    r"interval(?:s)? (?:and|,)? ?(?:harmon|chord|rhythm)|identification of intervals|"
    r"pitch[- ]memory|pitch memory|rhythmic dictation|zkoušku paměti|"
    r"musical erudition|playing an instrument|plays? an instrument|"
    r"sight[- ]read|solf[eè]ge|solfeggio|solfe[žz]|"
    r"music test.{0,40}(?:piano|interval|harmon)|"
    r"(?:piano|interval|harmon).{0,40}music test|"
    r"Eignungspr[uü]fung.{0,60}(?:musik|piano|geh[oö]r)|"
    r"musikalische Eignungspr[uü]fung|Vorspiel",
    re.I)

# "no audition", "there is no live admission exam", "None. Portfolio-based selection…"
RX_NO = re.compile(
    # The article is not optional decoration. Without it "NOT AN AUDITION" and
    # "NOT AN EAR-TRAINING EXAM" both slip past, and three records that say in capitals
    # that they have neither were flagged as having both — including HfMT Köln, whose
    # field opens "YES, but NOT an instrumental audition", and FHNW Basel, whose field
    # opens "THE DECISIVE PART IS A PORTFOLIO HEARING, NOT AN AUDITION".
    r"(?:no|none|without|not?)\s+(?:an?\s+|the\s+)?(?:live\s+)?"
    r"(?:instrumental\s+|performance\s+|music(?:al)?\s+)?"
    r"(?:admission\s+)?(?:audition|exam|ear[- ]training|aural)|"
    r"there is no live|no live admission|audition:\s*none|"
    r"selection is (?:entirely )?(?:document|portfolio)",
    re.I)

# An emphatic denial in the opening of a field governs the whole field. "Vorspiel" appearing
# 300 characters later is the schedule of the round he does not have to sit, not a finding.
RX_DENIES_UP_FRONT = re.compile(
    r"^.{0,240}?(?:NOT AN? (?:AUDITION|EAR[- ]TRAINING)|NOT AN? INSTRUMENTAL|"
    r"IS NOT AN AUDITION|NO AUDITION|NONE\.|THERE IS NO LIVE)", re.I | re.S)

# a correction that says the recorded cost is wrong
RX_COST = re.compile(
    r"cost band.{0,40}wrong|cost.{0,20}(?:badly )?wrong|wrong by a factor|"
    r"factor of (?:six|ten|twenty|\d+)|"
    r"\bCOST\b\s*[:—-]|cost band recorded|recorded as .{0,40}(?:wrong|actually)|"
    r"tuition.{0,30}(?:is wrong|not the|actually)|fee.{0,30}(?:is wrong|actually)|"
    r"the (?:EEA|EU) rate|is the (?:EEA|EU) rate",
    re.I)

# a correction that says the programme does not exist / is not a degree / is suspended
RX_EXISTS = re.compile(
    r"discontinued|suspended|no longer (?:offered|admits|exists)|does not exist|"
    r"is not a master|not a master's degree|is not a degree|no 20\d\d intake|"
    r"no intake in|wird aktuell nicht angeboten|nimmt .{0,30}keine neuen",
    re.I)


def _hit(rx, text):
    """A match that is not immediately preceded or followed by a denial."""
    for m in rx.finditer(text):
        window = text[max(0, m.start() - 60):m.end() + 40]
        if RX_NO.search(window):
            continue
        return m.group(0)
    return ""


def analyse(rec):
    """rec: a dict with any of correction / verdictWhy / audition / entry.

    Returns the flags, and for each the sentence that triggered it, so the reader can
    judge rather than trust.
    """
    corr = str(rec.get("correction") or "")
    why = str(rec.get("verdictWhy") or "")
    aud = str(rec.get("audition") or "")

    out = {"auditionDisputed": "", "auditionSource": "",
           "costDisputed": "", "existenceDisputed": ""}

    # An audition named in the VERIFIED prose is a confirmed finding. The same words in
    # the raw auditionSpec field are only a suspicion — that field was written by a search
    # agent and never re-checked, so treating the two alike would let 46 unverified records
    # wear the authority of the 36 verified ones. Confirmed wins; suspected is still shown,
    # but labelled as what it is.
    for field, src in ((corr, "confirmed"), (why, "confirmed"), (aud, "suspected")):
        if RX_DENIES_UP_FRONT.search(field):
            continue
        h = _hit(RX_AUDITION, field)
        if h:
            out["auditionDisputed"] = h
            out["auditionSource"] = src
            break
    if corr:
        h = _hit(RX_COST, corr)
        if h:
            out["costDisputed"] = h
        h = RX_EXISTS.search(corr)
        if h:
            out["existenceDisputed"] = h.group(0)
    return out


if __name__ == "__main__":
    import json, sys
    d = json.load(open("app/public/data/programmes.json", encoding="utf-8"))
    # the cases the critic named, plus the ones that must NOT trip
    EXPECT = {
        253: ("audition", True), 254: ("audition", True),
        258: ("audition", True), 259: ("audition", True), 260: ("audition", True),
        120: ("cost", True), 5: ("cost", True),
    }
    bad = 0
    for i, want in EXPECT.items():
        a = analyse(d[i])
        got = bool(a["auditionDisputed"] if want[0] == "audition" else a["costDisputed"])
        ok = got == want[1]
        bad += not ok
        print(f"  {'ok ' if ok else 'CHK'} id {i:<4} {want[0]:<9} -> {got}   "
              f"{d[i]['institution'][:34]}")
    # Edinburgh says "no audition" in terms — it must not be flagged for one
    a120 = analyse(d[120])
    ok = not a120["auditionDisputed"]
    bad += not ok
    print(f"  {'ok ' if ok else 'CHK'} id 120  no-audition claim respected -> {not ok}")

    n = {k: sum(1 for r in d if analyse(r)[k]) for k in
         ("auditionDisputed", "costDisputed", "existenceDisputed")}
    print(f"\nmismatches: {bad}")
    print("across all 398:", n)
