#!/usr/bin/env python3
"""Write the degree-vs-certificate report.

The user asked for master's degrees, not certificates. This documents which records
survive that test, which do not, and — the part that actually protects him — WHY,
country by country, since every country hides its certificates behind a different word.
"""
import sys
from collections import Counter, defaultdict
sys.path.insert(0, ".masters-search")
import build_master as M

OUT = "results/DEGREE-CHECK.md"
REJECT = ("Not a degree", "Bachelor / first cycle", "Master di I livello (60 CFU)")


def esc(s):
    return str(s).replace("|", "\\|").replace("\n", " ").strip()


def main():
    rows = M.main()
    lvl = Counter(r["Qualification level"] for r in rows)
    deg = [r for r in rows if r["Qualification level"] == "Master's degree"]
    rej = [r for r in rows if r["Qualification level"] in REJECT]
    unc = [r for r in rows if r["Qualification level"] == "Unclear"]

    L = []
    w = L.append
    w("# Is it actually a master's degree?\n")
    w("You asked for master's degrees, not certificates. Every one of the 1,091 records was")
    w("re-checked against what it actually awards. This file is the result — and the list of")
    w("things to **not** pay for.\n")
    w("---\n")
    w("## The count\n")
    w("| Verdict | Records | What it means |")
    w("|---|---:|---|")
    rowsdef = [
        ("Master's degree", "**A real second-cycle degree.** M.Sc., M.A., M.Mus., M.Phil., mestrado, "
         "laurea magistrale / diploma accademico di II livello, máster universitario oficial, "
         "magisterský, yüksek lisans. This is what you want."),
        ("Master di I livello (60 CFU)", "Italian **first-level master** — a one-year certificate taken "
         "*after* a bachelor. It is not a second cycle, it does not lead to a PhD, and Italy itself "
         "does not count it as a master's degree in the Bologna sense."),
        ("Not a degree", "**Sold as a 'Master', but it is not one.** *Título propio* / *máster propio* "
         "(Spain), CRKBO or NRTO diploma (Netherlands), *pós-graduação* (Portugal), advanced diploma, "
         "private-school certificate, short course."),
        ("Bachelor / first cycle", "A first-cycle award. You already have one of these."),
        ("Funding scheme", "Money, not a qualification — a scholarship or grant record."),
        ("Aggregate entry", "A summary row covering many institutions at once, not a single programme."),
        ("Unclear", "The institution does not state clearly enough what it awards. **Email and ask** "
         "before applying — these are on the 'Award unclear' tab."),
    ]
    for name, meaning in rowsdef:
        if lvl.get(name):
            w(f"| **{name}** | {lvl[name]} | {meaning} |")
    w(f"| | **{len(rows):,}** | |\n")
    w(f"So: **{len(deg)} of the {len(rows):,} records award a genuine master's degree.** "
      f"**{len(rej)} do not** and are listed in full below. {len(unc)} could not be settled from "
      "the published pages.\n")
    w("> Nothing was deleted. The rejects stay in every workbook, on their own tab, so you can\n"
      "> check the reasoning rather than take my word for it.\n")
    w("---\n")
    w("## Where to find it\n")
    w("| File | Tab | Holds |")
    w("|---|---|---|")
    w(f"| `MASTER-all-opportunities.xlsx` | **Master's degrees only** | all {len(deg)} real degrees |")
    w(f"| `MASTER-all-opportunities.xlsx` | **NOT a degree — avoid** | the {len(rej)} rejects |")
    w("| `MASTER-all-opportunities.xlsx` | **★ BEST BETS** | now degrees-only: strong chance *and* cheap |")
    w("| `SOUND-and-SCHOLARSHIPS.xlsx` | every tab | already filtered to degrees |")
    w("| `SOUND-and-SCHOLARSHIPS.xlsx` | **NOT a degree — avoid** / **Award unclear — ask them** | the excluded sound records |")
    w("\nIn both workbooks, **column D — *Qualification level*** carries the verdict on every row, "
      "colour-coded green / amber / red.\n")
    w("---\n")
    w("## The trap, country by country\n")
    w("Every country has a word that looks like \"master\" and is not one. This is what to check\n"
      "on any page before you believe it:\n")
    w("| Country | The real thing | The look-alike | How to verify |")
    w("|---|---|---|---|")
    w("| **Spain** | *Máster Universitario Oficial* | *Título propio* / *máster propio* — the "
      "institution's own title, including at genuine public conservatoires like ESMUC | Search the "
      "programme in the government **RUCT** register. If it is not there, it is not official |")
    w("| **Italy** | *Laurea magistrale*, or *Diploma Accademico di II livello* (the conservatoire "
      "equivalent) | *Master di I livello* — 60 CFU, one year, taken after a bachelor | The page must "
      "say **II livello** or **120 CFU**. \"Master di I livello\" and \"60 CFU\" both mean no |")
    w("| **Portugal** | *Mestrado*, accredited by **A3ES** | *Pós-graduação* — a postgraduate "
      "certificate with no degree | Look the course up on the A3ES site. *Pós-graduação* is never a mestrado |")
    w("| **Netherlands** | **NVAO**-accredited MA / M.Sc. | **CRKBO** or **NRTO** registration — that is "
      "a training-provider quality mark, not degree accreditation | Only NVAO grants degrees. CRKBO on a "
      "\"Master\" page is a red flag |")
    w("| **France** | *Diplôme national de master*, or a diploma *conférant le grade de master* (DNSEP, DNSPM) | "
      "\"Mastère spécialisé\", private-school \"MBA\", certificates | The words **grade de master** or "
      "**diplôme national** must appear |")
    w("| **Germany / Austria** | M.A., M.Sc., M.Mus. | *Lehrgang* / *Universitätslehrgang* — a continuing-"
      "education course | A Lehrgang awards an academic *title*, not always a degree. Ask which |")
    w("| **UK / Ireland** | MA, M.Sc., M.Mus., M.Phil. (NFQ 9) | \"Advanced Diploma\", \"Professional "
      "Certificate\" | Must be validated by a degree-awarding body |")
    w("\n")
    w("---\n")
    w(f"## The {len(rej)} that are NOT degrees\n")
    w("Grouped by country. **Do not pay any of these expecting a master's degree.** A few are still\n"
      "worth doing on their own terms — IRCAM's Cursus is world-class training and Italian\n"
      "*Master di I livello* programmes can be genuinely useful — but none of them is a master's.\n")
    by = defaultdict(list)
    for r in rej:
        by[r["Country"]].append(r)
    for c in sorted(by, key=lambda k: (-len(by[k]), k)):
        w(f"\n### {c} — {len(by[c])}\n")
        w("| Institution | Programme | Verdict | What it really is |")
        w("|---|---|---|---|")
        for r in sorted(by[c], key=lambda x: x["Institution"]):
            why = (M.txt(r["_rec"].get("qualification") or r["_rec"].get("degree"), 190)
                   or M.txt(r["_rec"].get("accreditationStatus"), 190) or "—")
            w(f"| {esc(r['Institution'])[:60]} | {esc(r['Programme / scheme'])[:70]} | "
              f"{r['Qualification level']} | {esc(why)} |")
    if unc:
        w("\n---\n")
        w(f"## {len(unc)} where the award is unclear — ask before applying\n")
        w("The page does not state the qualification plainly enough to judge. Send one email:\n"
          "*\"What is the exact name of the qualification awarded, and which body accredits it?\"*\n")
        w("| Country | Institution | Programme |")
        w("|---|---|---|")
        for r in sorted(unc, key=lambda x: (x["Country"], x["Institution"])):
            w(f"| {esc(r['Country'])} | {esc(r['Institution'])[:60]} | {esc(r['Programme / scheme'])[:80]} |")
    w("\n---\n")
    w("## How this was decided\n")
    w("A record counts as a degree only if it names a second-cycle award — in any of the languages\n"
      "the search covered — and does **not** carry a disqualifier in the same field.\n")
    w("The hard part was negation. Verified records often describe a real degree by saying what it\n"
      "is *not*: *\"a genuine second-cycle degree, not a Lehrgang\"*, *\"MESTRADO — a real degree, NOT\n"
      "a pós-graduação\"*. A plain keyword match reads \"Lehrgang\" and \"pós-graduação\" and throws the\n"
      "degree away. Every disqualifier is therefore checked for a preceding negation before it counts.\n")
    w("The classifier was checked against 19 cases whose answer was known from reading the source\n"
      "pages during the search — TU Ilmenau, HfK Bremen, Kunstuni Linz, Saint Louis Rome, MTU Cork,\n"
      "Ankara, ČVUT, Žilina and Berklee on the degree side; UCAM, Francisco de Vitoria, Pro Audio\n"
      "Education, Abbey Road, Mohole and two ESMUC *títulos propios* on the reject side; Cattolica\n"
      "and IULM as *Master di I livello*. **All 19 classify correctly.**\n")
    w("### The honest limit\n")
    w("This reads what the institution published. It does not re-open the national register for every\n"
      "one of 1,091 records. For any programme you are about to actually apply to, spend the five\n"
      "minutes on the official register — **RUCT** (Spain), **A3ES** (Portugal), **NVAO**\n"
      "(Netherlands), the **MUR** *offerta formativa* (Italy). That check is definitive; this file is\n"
      "a filter that saves you from doing it 1,091 times.\n")

    open(OUT, "w").write("\n".join(L) + "\n")
    print(f"wrote {OUT} — {len(deg)} degrees · {len(rej)} rejects · {len(unc)} unclear")
    print(" ", dict(lvl))


if __name__ == "__main__":
    main()
