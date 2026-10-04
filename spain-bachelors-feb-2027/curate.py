"""Merge the six research-group JSON files into one curated dataset (final.json).

Several groups found the same Catalan February-round programmes; this keeps one
row per programme (group A's record as the base, patched with the extra facts
other groups found), moves rows that cannot be studied fully in English or
French to Rejected, and adds two fields the workbook sorts on:
  feb_places_2026      places offered in the official Feb 2026 list
  visa_payment_eur     what must be PAID to hold a visa-valid admission. RD 1155/2024
                       art. 53.1.a requires the fees to have been paid ("haber abonado
                       los derechos de inscripción, matrícula o documento equivalente"),
                       so for Feb-round places this is the official Feb–June enrolment
                       price from the Generalitat list.
"""
import copy
import json
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])

load = lambda name: json.loads((SRC / name).read_text(encoding="utf-8"))
A = load("A_catalan_public.json")
B = load("B_catalan_affiliated_private.json")
C = load("C_national_madrid_sevilla.json")
D = load("D_private_madrid.json")
E = load("E_private_other.json")
F = load("F_discovery_sweep.json")

FEB26 = "https://universitats.gencat.cat/web/.content/02_preinscripcio/enllac-documents/Preins-2026-Febrer.pdf"
BOE_RD1155 = "https://www.boe.es/buscar/act.php?id=BOE-A-2024-24099"
UDL_PRICE = "https://www.udl.cat/ca/serveis/aga/matricula/importaproximat_graus/index.html"
VISA_RULE = ("RD 1155/2024 art. 53.1.a: the visa needs admission AND paid enrolment/registration fees; "
             "a bare seat reservation is refused by some consulates (e.g. Nador).")


def add_src(p, key, *urls):
    fs = p.setdefault("field_sources", {})
    lst = fs.setdefault(key, [])
    for u in urls:
        if u not in lst:
            lst.append(u)


def prog(src, i, group):
    p = copy.deepcopy(src["programs"][i])
    p["_group_override"] = group
    return p


programs = []

# 1. UdL Estudis Anglesos — public price, cheapest
p = prog(A, 5, "A + verification")
p["feb_places_2026"] = 5
p["visa_payment_eur"] = 683.55
p["visa_payment_text"] = ("COMPUTED, not published: Feb 2026 list gives no price (note 16 = public price decree). "
                          "UdL 2026-27: 17.69 EUR/credit + fixed fees 69.80 + 81.93 + 1.12 (UdL page updated 18.06.2026). "
                          "Assuming a 30-ECTS second-semester enrolment: 30 x 17.69 + 152.85 = 683.55 EUR. "
                          "UdL bills in instalments (first = 40% of credits + fees, per group A). " + VISA_RULE)
add_src(p, "visa_payment", FEB26, UDL_PRICE, BOE_RD1155)
programs.append(p)

# 2. UAB / EUTDH Tourism in English (A4 + B3 + C2 duplicates)
p = prog(A, 4, "A (dup. in B, C, F)")
p["feb_places_2026"] = 5
p["visa_payment_eur"] = 2760
p["visa_payment_text"] = ("Official Feb 2026 list: indicative price 2,760 EUR for the Feb–June semester only. "
                          "EUTDH lets you pay 60% at enrolment + 40% later (2025/26 conditions). " + VISA_RULE)
add_src(p, "visa_payment", FEB26, BOE_RD1155)
programs.append(p)

# 3. UVic-UCC Global Studies (A6 + B4)
p = prog(A, 6, "A (dup. in B)")
p["feb_places_2026"] = 10
p["visa_payment_eur"] = 3180
p["visa_payment_text"] = "Official Feb 2026 list: indicative price 3,180 EUR for the Feb–June semester only. " + VISA_RULE
p["language"] += " — French is one of the two Language-B options"
add_src(p, "visa_payment", FEB26, BOE_RD1155)
programs.append(p)

# 4. CETT Tourism in English (A1 + B1 + C0)
p = prog(A, 1, "A (dup. in B, C)")
p["feb_places_2026"] = 10
p["visa_payment_eur"] = 4645
p["visa_payment_text"] = ("Official Feb 2026 list: indicative price 4,645 EUR for the Feb–June semester only "
                          "(CETT non-EU enrolment fee 925 EUR is part of the annual 8,107 EUR). "
                          "Possible earlier route: 55 EUR credit-transfer study (non-refundable, deducted if you enrol, "
                          "answer within 3 weeks); with >=30 ECTS recognised you apply directly to CETT for admission. " + VISA_RULE)
p["application_fee_eur"] = 0
p["application_fee_text"] = ("No fee found for the Generalitat pre-enrolment (none listed on the official 'how to apply' page, "
                             "which does not say it is free either). Credit-recognition route: 55 EUR non-refundable study fee.")
add_src(p, "visa_payment", FEB26, "https://www.cett.es/en/admission", BOE_RD1155)
programs.append(p)

# 5. ESIC Barcelona Marketing in English (A0 + B0 + C1 + F2)
p = prog(A, 0, "A (dup. in B, C, F)")
p["feb_places_2026"] = 16
p["visa_payment_eur"] = 4815
p["visa_payment_text"] = ("Official Feb 2026 list: indicative price 4,815 EUR for the Feb–June semester only. "
                          "ESIC's own reservation amount NOT FOUND. " + VISA_RULE)
p["tuition_text"] = p["tuition_text"].replace("(figure used = upper bound)", "(the higher figure is shown)")
add_src(p, "visa_payment", FEB26, BOE_RD1155)
programs.append(p)

# 6. CETT International Hotel Management (A2 + B2)
p = prog(A, 2, "A (dup. in B)")
p["feb_places_2026"] = 10
p["visa_payment_eur"] = 5483
p["visa_payment_text"] = "Official Feb 2026 list: indicative price 5,483 EUR for the Feb–June semester only. " + VISA_RULE
p["feb_start_confirmed"] = "YES in the Feb 2026 round; whether Feb entrants can take the 100% English track is UNCLEAR"
add_src(p, "visa_payment", FEB26, BOE_RD1155)
programs.append(p)

# 7. UCAM Dentistry in English — Feb entry last listed in Jan 2024
p = prog(E, 0, "E")
p["feb_places_2026"] = "Not in 2025 or 2026 lists"
p["visa_payment_eur"] = "NOT FOUND"
p["visa_payment_text"] = ("Known non-refundable fees: application 150 + pre-inscription 390 = 540 EUR; the reservation fee "
                          "for international/English programmes is not published. " + VISA_RULE)
p["feb_start_confirmed"] = "UNCLEAR (English group listed for Feb 2024 only)"
add_src(p, "visa_payment", "https://international.ucam.edu/studies/bachelor-in-dentistry-cartagena-on-campus", BOE_RD1155)
programs.append(p)

for p in programs:
    p["_group"] = p.pop("_group_override")
    if p["feb_start_confirmed"] == "YES":
        p["feb_start_confirmed"] = "YES in the Feb 2026 round (2027 list not published until ~late Jan 2027)"

# ---------------------------------------------------------------- rejected
DROP = {("B", 0), ("B", 4), ("B", 18), ("B", 6), ("B", 3), ("F", 0), ("F", 11), ("F", 21),
        ("F", 13), ("A", 3), ("A", 4)}
groups = {"A": A, "B": B, "C": C, "D": D, "E": E, "F": F}
names = {"A": "A Catalan public", "B": "B Catalan affiliated/private", "C": "C National/Madrid/Sevilla",
         "D": "D Private Madrid", "E": "E Private other", "F": "F Discovery sweep"}
rejected = []
for g, d in groups.items():
    for i, r in enumerate(d.get("rejected", [])):
        if (g, i) in DROP:
            continue
        r = copy.deepcopy(r)
        r["_group"] = names[g]
        rejected.append(r)

def merged_rej(base, extra_reason, extra_urls, group):
    r = copy.deepcopy(base)
    r["reason"] = r["reason"].rstrip() + " " + extra_reason
    r["source_urls"] = list(dict.fromkeys((r.get("source_urls") or []) + extra_urls))
    r["_group"] = group
    return r

# EUNCET: keep the cost facts the user asked about
eu = B["programs"][7]
rejected.append({
    "university": "Euncet Business School (Centre Universitari Euncet) — affiliated to UPC",
    "city": "Terrassa / Barcelona", "type": "Affiliated centre of UPC (public university); private-priced",
    "degree": eu["degree"],
    "reason": ("LANGUAGE: Catalan/Spanish with only some subjects in English; no complete English track, and EUNCET "
               "advises a sufficient level of Spanish. Otherwise it fits: Feb 2026 places (Feb–June 3,300–3,600 EUR); "
               "600 EUR advance payment to formalise admission, deducted from tuition but NOT refunded if the visa is "
               "refused (only if access requirements are not met); 134 EUR/credit = 8,040 EUR/yr presencial (2026-27); "
               ">=30 ECTS recognised gives direct admission (file study 54.54 EUR)."),
    "source_urls": [FEB26] + eu["field_sources"]["fees_deposit"] + eu["field_sources"]["language"],
    "_group": "B (dup. in A)",
})
# EAE ADE / BBA: sources disagree on the language
ea = B["programs"][5]
rejected.append({
    "university": "Centre Universitari EAE (EAE Business School Barcelona) — affiliated to UdL",
    "city": "Barcelona", "type": "Affiliated centre of UdL (public university); private-priced",
    "degree": "Grado en ADE y Transformación de Negocios (code 61077), marketed as 'BBA'",
    "reason": ("LANGUAGE CONFLICT, treated as not English: the official-degree page says 'Full-time (Spanish)' and "
               "'start with subjects in Spanish and gradually move towards content in English', so first-year (Feb) "
               "entrants study in Spanish; EAE's fees page and enquiry form also list an English/bilingual BBA "
               "(11,500 EUR/yr). Ask EAE whether an English-only group takes Feb entrants. If yes, it fits: 44 Feb 2026 "
               "places, Feb–June 5,750 EUR, and EAE refunds after a visa refusal only after an administrative appeal, "
               "minus bank/admin costs."),
    "source_urls": [FEB26, "https://www.eae.es/en/degree/bachelors-degree-in-business-administration-and-management/presentation"]
                   + ea["field_sources"]["language"] + ea["field_sources"]["refund"],
    "_group": "A/B/F (merged)",
})
# CETT Open degree
co = A["programs"][3]
rejected.append({
    "university": co["university"], "city": co["city"], "type": co["type"], "degree": co["degree"],
    "reason": ("Not completable in English: two of the four component degrees are Spanish/Catalan only and the "
               "English share is not published. Feb 2026: 5 places, Feb–June 5,517 EUR."),
    "source_urls": [FEB26] + co["field_sources"]["language"],
    "_group": "A",
})
# merged duplicates
rejected.append(merged_rej(F["rejected"][13], "Also reported: UK partner degrees (Derby / London Met / Dublin Business School).",
                           B["rejected"][16].get("source_urls", []), "B/F (merged)"))
rejected.append(merged_rej(C["rejected"][8], "(Confirmed by the discovery sweep: 'Admisión Segundo Semestre', apply 18–22 Jan 2027.)",
                           F["rejected"][0].get("source_urls", []), "C/F (merged)"))
rejected.append(merged_rej(B["rejected"][17], F["rejected"][21]["reason"], F["rejected"][21].get("source_urls", []), "B/F (merged)"))

# ---------------------------------------------------------------- sources
sources = {}
for g, d in groups.items():
    for s in d.get("sources", []):
        u = (s.get("url") or "").strip()
        if not u:
            continue
        if u in sources:
            uf = s.get("used_for") or ""
            if uf and uf not in sources[u].get("used_for", ""):
                sources[u]["used_for"] = (sources[u].get("used_for", "") + "; " + uf).strip("; ")
        else:
            s = copy.deepcopy(s)
            sources[u] = s
    # URLs cited only inside records (incl. duplicates that were dropped)
    for p in d.get("programs", []):
        for k, urls in (p.get("field_sources") or {}).items():
            for u in ([urls] if isinstance(urls, str) else urls or []):
                sources.setdefault(u, {"url": u, "title": "", "official": "", "last_updated": "",
                                       "used_for": f"{p.get('university', '')[:60]}: {k}"})
    for r in d.get("rejected", []):
        for u in r.get("source_urls") or []:
            sources.setdefault(u, {"url": u, "title": "", "official": "", "last_updated": "",
                                   "used_for": f"Rejected: {r.get('university', '')[:60]}"})
sources.setdefault(UDL_PRICE, {"url": UDL_PRICE, "title": "UdL — Import aproximat de la matrícula de grau 2026-27",
                               "official": True, "last_updated": "2026-06-18",
                               "used_for": "UdL price per credit (17.69 EUR) and fixed fees; basis of the computed Feb–June cost"})
if BOE_RD1155 not in sources:
    sources[BOE_RD1155] = {"url": BOE_RD1155, "title": "Real Decreto 1155/2024 — Reglamento de Extranjería (BOE consolidated text)",
                           "official": True, "last_updated": "2026-09-22 (consolidated)",
                           "used_for": "Visa rules: art. 52.2 full-time = enrolled in >=90% of credits; art. 53.1.a admission + paid fees; "
                                       "art. 54 apply >=2 months before start (later only if the enrolment procedure requires it, justified)"}
for p in programs + rejected:
    for u in ([x for v in (p.get("field_sources") or {}).values() for x in v] + (p.get("source_urls") or [])):
        sources.setdefault(u, {"url": u, "title": "", "official": "", "last_updated": "", "used_for": p.get("university", "")[:60]})

out = {"group": "curated", "programs": programs, "rejected": rejected, "sources": list(sources.values())}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"programs={len(programs)} rejected={len(rejected)} sources={len(sources)}")
