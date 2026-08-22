#!/usr/bin/env python3
"""Score programmes on the client's stated weights and print a ranked table.

Weights come straight from the mission: funding odds 40%, admission fit for the
300-ECTS engineering diploma 25%, path priority 15% (A/C/N highest), city and
scene value 10%, total cost 10%, then a 15% penalty on German-taught rows
because the client disprefers German without ruling it out.

The score orders candidates; it does not choose them. Anything UNVERIFIED is
excluded here and surfaces only in the risk section, per the tooling rules.
"""
import csv, re, sys

def num(s):
    if not s: return None
    s = str(s).replace(',', '')
    m = re.search(r'(\d+(?:\.\d+)?)', s)
    return float(m.group(1)) if m else None

def funding(r):
    cov = (r['scholarship_coverage_level'] or '').strip()
    tun = (r['tunisia_eligible'] or '').strip().lower()
    base = {'full+stipend': 1.0, 'full_tuition': 0.8, 'partial': 0.45, 'none_found': 0.05}.get(cov, 0.2)
    # a scholarship the client cannot win is worth nothing to him
    mult = {'yes': 1.0, 'likely': 0.8, 'unclear': 0.5, 'no': 0.1}.get(tun, 0.5)
    fee = num(r['tuition_non_eu_eur_per_year'])
    # a programme that is nearly free needs no scholarship to be affordable
    if fee is not None and fee <= 1500: base = max(base, 0.9); mult = max(mult, 0.9)
    elif fee is not None and fee <= 5500: base = max(base, 0.6); mult = max(mult, 0.8)
    return base * mult

def admission(r):
    return {'yes_explicit': 1.0, 'likely': 0.7, 'unclear': 0.4, 'no': 0.05}.get(
        (r['accepts_engineering_bachelor'] or '').strip(), 0.4)

SUBJECT = re.compile(r'\b(audio|acoustic|ac[uú]stic|sound|sonid|sonor|music|m[uú]sic|musik|sonolog|'
                     r'geluid|tonmeister|klang)\b', re.I)
GROUP   = re.compile(r'sigmat|music technology group|audio communication|music cognition|'
                     r'audio.{0,20}(group|lab)|(group|lab).{0,20}audio|speech.{0,15}(group|technolog)', re.I)
ADJACENT= re.compile(r'signal process|telecomunicaci|telecommunication|dsp\b|multimedia', re.I)
FILLER  = re.compile(r'completeness row|safety choice|back-?up choice|useful .{0,20}back-?up|'
                     r'confirms .{0,30}provision exists', re.I)

def music_substance(r):
    """How much of this programme is actually about sound?

    Path letters came from ten agents working in parallel, and the discovery
    brief told them to log generously. That was right for coverage and wrong for
    ranking: a generic Ingenieria Informatica in Huelva got tagged C because it
    is computer science, not because anything in it touches audio. Its own
    fit_notes call it a "completeness row". Left uncorrected, sixteen such rows
    outranked every music programme in the sweep.

    So the path weight is modulated by evidence, which fixes the input rather
    than bending the mission's weights. Business paths are exempt — a marketing
    master is not supposed to be about sound.
    """
    name = r['program_name'] or ''
    blob = ' '.join([name, r['fit_notes'], r['entry_requirements_summary']])
    if SUBJECT.search(name):        return 1.0    # sound IS the subject
    if GROUP.search(blob):          return 0.70   # a named audio group to thesis with
    if FILLER.search(blob):         return 0.15   # the row says of itself that it is filler
    if ADJACENT.search(blob):       return 0.45   # signal processing to build on
    return 0.20

def path(r):
    ls = [x.strip() for x in (r['path_letter'] or '').split(',') if x.strip()]
    TECH = {'A':1.0,'C':1.0,'N':1.0,'H':0.75,'G':0.7,'R':0.5}
    BIZ  = {'J':0.6,'L':0.6,'AC':0.4,'AD':0.4}
    sub = music_substance(r)
    best = 0.20
    for L in ls:
        if L in TECH: best = max(best, TECH[L]*sub)   # sound paths must show sound
        elif L in BIZ: best = max(best, BIZ[L])       # business paths need not
    return best

CITY = {'barcelona':1.0,'amsterdam':1.0,'berlin':1.0,'rotterdam':0.75,'utrecht':0.7,'the hague':0.7,
        'den haag':0.7,'madrid':0.7,'valencia':0.6,'eindhoven':0.55,'delft':0.6,'granada':0.5,
        'malaga':0.5,'málaga':0.5,'sevilla':0.5,'seville':0.5,'groningen':0.45,'tilburg':0.4,
        'twente':0.4,'enschede':0.4,'nijmegen':0.4,'maastricht':0.4,'linares':0.25,'gandia':0.3}
def city(r):
    c = (r['city'] or '').lower()
    for k, v in CITY.items():
        if k in c: return v
    return 0.4

def cost(r):
    fee = num(r['tuition_non_eu_eur_per_year'])
    if fee is None: return 0.4
    if fee <= 1200: return 1.0
    if fee <= 3000: return 0.85
    if fee <= 6000: return 0.7
    if fee <= 12000: return 0.45
    if fee <= 20000: return 0.25
    return 0.1

def german(r):
    lang = (r['language_of_instruction'] or '').lower()
    return ('german' in lang or 'deutsch' in lang) and 'english' not in lang


# Award-level failures. Anchored on statements ABOUT THE AWARD, and read from
# degree_awarded / red_flags only. An earlier version searched fit_notes for the
# bare word "bachelor" and excluded 125 rows — Berklee, Sonology, HKU, Catalyst —
# because entry-requirement prose naturally says "a bachelor's degree in...".
NOT_A_DEGREE = re.compile(
    r"not an? (accredited |official |real |state[- ]recognised )?(master|degree)|"
    r"awards no degree|no (real |actual )?degree is awarded|certificate only|"
    r"private certificate|NOT A DEGREE|not a t[ií]tulo oficial|"
    r"does not (offer|award)[^.]{0,40}(degree|master)|"
    r"entry (is|sits) below (degree|bachelor) level|"
    r"\b(CFGS|FP de grado|MBO niveau)\b|is itself a bachelor", re.I)

# Programme closure. "closed" alone matched scholarships being closed at Esade,
# UPF-BSM and RUG, so the word must sit next to the programme, not the money.
CLOSED = re.compile(
    r"(programme|program|master|course|admission|recruitment|intake|cohort)[^.]{0,40}"
    r"(is closed|closed|suspended|stopped|withdrawn|discontinued|not recruiting)|"
    r"(admission|recruitment) stopped|confirmed dead|no 20\d\d-\d\d cohort|"
    r"summer[- ]semester[- ]only|sommersemester only", re.I)

NO_VISA = re.compile(
    r"cannot grant you a Student Visa|not eligible for a Visa|"
    r"will NOT support a Tunisian[^.]{0,30}visa|"
    r"(delivered|taught|is) (100% |fully |wholly )?online[- ](only|delivery)", re.I)

def viability(r):
    """Can he enrol on this for September 2027, get a real degree, and get a visa?

    A gate the score cannot override. Without it the top five held a suspended
    Erasmus Mundus, a film academy that awards a certificate, and a five-month
    private course — each scoring well on price and access and worth nothing as
    an outcome. Reasons are returned rather than swallowed: an excluded
    programme stays in the dataset and in GAPS.md, it just is never recommended.
    """
    award = ' '.join([r['degree_awarded'], r['red_flags']])
    body  = ' '.join([r['degree_awarded'], r['red_flags'], r['fit_notes'], r['program_name']])
    reasons = []
    if NOT_A_DEGREE.search(award): reasons.append("not a master's degree")
    if CLOSED.search(body):        reasons.append('closed / not admitting for Sept 2027')
    if NO_VISA.search(body):       reasons.append('cannot support a Tunisian student visa')
    if (r['accepts_engineering_bachelor'] or '') == 'no': reasons.append('entry gate excludes him')
    if 'NEGATIVE FINDING' in r['program_name'] or 'COVERAGE CHECK' in r['program_name']:
        reasons.append('placeholder row, not a programme')
    return reasons

def score(r):
    s = (0.40*funding(r) + 0.25*admission(r) + 0.15*path(r) + 0.10*city(r) + 0.10*cost(r))
    return s*0.85 if german(r) else s

def main():
    rows = list(csv.DictReader(open('deliverables/master_programs.csv')))
    usable = [r for r in rows if r['verification_status'] in ('VERIFIED','PARTIALLY_VERIFIED')]
    excluded = []
    keep = []
    for r in usable:
        why = viability(r)
        r['_excluded'] = '; '.join(why)
        (excluded if why else keep).append(r)
    for r in keep: r['_score'] = score(r)
    keep.sort(key=lambda r: -r['_score'])
    print(f"{len(rows)} rows | {len(usable)} usable | {len(excluded)} fail the viability gate | "
          f"{len(keep)} shortlistable\n")
    if '-v' in sys.argv:
        print('--- excluded, with reasons ---')
        for r in excluded[:40]:
            print(f"  {r['_excluded'][:52]:<54}{r['institution'][:28]} | {r['program_name'][:38]}")
        print()
    usable = keep
    print(f"{'#':<3}{'score':<7}{'path':<9}{'fee':<9}{'adm':<13}{'fund':<13}{'city':<13}{'programme'}")
    for i, r in enumerate(usable[:32], 1):
        fee = r['tuition_non_eu_eur_per_year'][:8]
        print(f"{i:<3}{r['_score']:.3f}  {r['path_letter'][:7]:<9}{fee:<9}"
              f"{r['accepts_engineering_bachelor'][:11]:<13}{r['scholarship_coverage_level'][:11]:<13}"
              f"{r['city'][:11]:<13}{r['institution'][:26]} | {r['program_name'][:40]}")
    import json
    json.dump([{k: r[k] for k in r if not k.startswith('_')} | {'score': round(r['_score'],4)}
               for r in usable], open('research/ranked.json','w'), indent=1)

main()
