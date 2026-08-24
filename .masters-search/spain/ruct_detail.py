#!/usr/bin/env python3
"""Fetch the RUCT detail page for every title in the backbone and extract the hard fields.

This turns out to answer several of the brief's starred schema fields authoritatively,
under a URL that can actually be cited (unlike the RUCT search form):

  * `Nº Créditos Complementos Formativos` -- literally the `complementos de formacion`
    question the 300-ECTS profile turns on. 0 means no bridging credits are baked into
    the title itself.
  * total ECTS and its breakdown (obligatorios / optativos / practicas / TFM)
  * MECES level, rama, campo de estudio
  * BOE verification + plan-de-estudios publication dates -- the citable evidence of
    official status
  * accreditation renewal results, and the centre that teaches it

Detail URL (deep-linkable, unlike the search):
  https://www.educacion.gob.es/ruct/estudio.action?codigoCiclo=SC&codigoTipo=M&CodigoEstudio=<code>&actual=estudios
"""
import json, re, html, sys, time, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

DETAIL = ("https://www.educacion.gob.es/ruct/estudio.action"
          "?codigoCiclo=SC&codigoTipo=M&CodigoEstudio={}&actual=estudios")

def text_of(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=60).read().decode("latin-1")
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", raw, flags=re.S | re.I)
    t = html.unescape(re.sub("<[^>]+>", "\n", t))
    return "\n".join(l.strip() for l in t.splitlines() if l.strip()), raw

def after(lines, label, n=1):
    """RUCT renders 'Label:' and its value as consecutive lines."""
    for i, l in enumerate(lines):
        if l.rstrip(":").strip().lower() == label.lower().rstrip(":"):
            if i + n < len(lines):
                return lines[i + n]
    return ""

def parse(code):
    url = DETAIL.format(code)
    txt, raw = text_of(url)
    L = txt.splitlines()
    def num(label):
        v = after(L, label)
        m = re.match(r"^(\d+)$", v.strip())
        return int(m.group(1)) if m else None
    boes = re.findall(r"BOE\s+(\d{2}/\d{2}/\d{4})", txt)
    accred = re.findall(r"(Resoluci[oó]n Favorable[^\n]*)\n(\d{2}/\d{2}/\d{4})", txt)
    return {
        "ruct_code": code,
        "ruct_url": url,
        "ruct_title": L[L.index("Inicio")+1] if "Inicio" in L else "",
        "nivel_academico": after(L, "Nivel académico:"),
        "meces": after(L, "Nivel MECES:"),
        "rama": after(L, "Rama:"),
        "campo_estudio": after(L, "Campo de estudio:"),
        "ects_obligatorios": num("Nº Créditos Obligatorios:"),
        "ects_optativos": num("Nº Créditos Optativos:"),
        "ects_practicas": num("Nº Créditos en Prácticas Externas:"),
        "ects_tfm": num("Nº Créditos Trabajo Fin de Grado/Master:"),
        "ects_complementos_formativos": num("Nº Créditos Complementos Formativos:"),
        "ects_total": num("Créditos Totales:"),
        "fecha_verificacion": after(L, "Fecha de verificación:"),
        "boe_dates": boes[:6],
        "accreditation": [f"{a} ({d})" for a, d in accred][:4],
        "centro": next((L[i+1] for i, l in enumerate(L)
                        if l.startswith("Centros en los que se imparte")), ""),
        "ccaa": next((m.group(1) for m in
                      [re.search(r"Comunidad (?:Aut[oó]noma )?(?:de |del |de la )?([A-Za-zÁÉÍÓÚÑáéíóúñ \-]+)", txt)] if m), ""),
    }

def main():
    src = Path("output/ruct-backbone.jsonl")
    rows = [json.loads(l) for l in src.read_text(encoding="utf-8").splitlines() if l.strip()]
    only_active = "--all" not in sys.argv
    todo = [r for r in rows if (r.get("active") or not only_active)]
    print(f"fetching {len(todo)} detail pages (of {len(rows)} backbone rows)", file=sys.stderr)
    out, errs = {}, 0
    def work(r):
        try:
            return parse(r["ruct_code"])
        except Exception as e:
            return {"ruct_code": r["ruct_code"], "error": str(e)[:120]}
    with ThreadPoolExecutor(max_workers=6) as ex:
        for i, d in enumerate(ex.map(work, todo), 1):
            if d.get("error"):
                errs += 1
            out[d["ruct_code"]] = d
            if i % 50 == 0:
                print(f"  {i}/{len(todo)} ({errs} errors)", file=sys.stderr)
    with open("output/ruct-detail.jsonl", "w", encoding="utf-8") as fh:
        for r in rows:
            d = out.get(r["ruct_code"])
            if d:
                fh.write(json.dumps({**r, **d}, ensure_ascii=False) + "\n")
    ok = [d for d in out.values() if not d.get("error")]
    zero = [d for d in ok if d.get("ects_complementos_formativos") == 0]
    print(json.dumps({"fetched": len(out), "errors": errs,
                      "with_ects_total": sum(1 for d in ok if d.get("ects_total")),
                      "zero_complementos": len(zero)}, indent=1))

if __name__ == "__main__":
    main()
