#!/usr/bin/env python3
"""Sweep RUCT across every term family for the nine fields -> output/ruct-backbone.jsonl

This is the registry backbone the brief's definition-of-done requires ("RUCT has been
queried directly for every field, not just Google"). Terms are deliberately SHORT and
unaccented: RUCT matches substrings, so `musica` catches every title containing it, and
long phrases match nothing.
"""
import sys, json, time
sys.path.insert(0, ".masters-search/spain")
import ruct

TERMS = {
 "A":  ["sonido","musica","musical","audio","sonora","sonoro"],
 "B":  ["musical","inteligencia artificial","musicologia"],
 "C":  ["acustica","senal","telecomunicacion","vibraciones","procesado","electronica"],
 "AA": ["inteligencia artificial","aprendizaje automatico","vision por computador",
        "lenguaje natural","machine learning","artificial intelligence","aprendizaje profundo"],
 "AB": ["ciencia de datos","data science","big data","datos","analitica","estadistica",
        "ciencia e ingenieria de datos"],
 "AC": ["nube","cloud","ingenieria de software","informatica","distribuidos",
        "ciberseguridad","sistemas inteligentes","ingenieria informatica"],
 "X":  ["business analytics","analitica de negocio","business intelligence","negocio",
        "empresarial","direccion de empresas"],
 "P":  ["industria musical","gestion musical","gestion cultural","industrias culturales",
        "musica","propiedad intelectual"],
 "S":  ["eventos","espectaculos","festivales","entretenimiento","ocio","turismo"],
}

def main():
    out, term_hits = {}, {}
    allterms = sorted({t for v in TERMS.values() for t in v})
    for i, t in enumerate(allterms, 1):
        try:
            rows = ruct.query(t)
        except Exception as e:
            print(f"[{i}/{len(allterms)}] {t!r} ERROR {e}", file=sys.stderr)
            continue
        term_hits[t] = len(rows)
        for r in rows:
            rec = out.setdefault(r["ruct_code"], {**r, "query_terms": [], "path_codes": []})
            if t not in rec["query_terms"]:
                rec["query_terms"].append(t)
            for code, terms in TERMS.items():
                if t in terms and code not in rec["path_codes"]:
                    rec["path_codes"].append(code)
        print(f"[{i}/{len(allterms)}] {t!r}: {len(rows)} rows, {len(out)} unique", file=sys.stderr)
        time.sleep(0.2)
    with open("output/ruct-backbone.jsonl", "w", encoding="utf-8") as fh:
        for code in sorted(out):
            r = out[code]
            r.pop("query_term", None)
            r["active"] = "EXTINGU" not in r["estado"].upper()
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(json.dumps({"unique_titles": len(out),
                      "active": sum(1 for r in out.values() if "EXTINGU" not in r["estado"].upper()),
                      "per_term": term_hits}, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
