#!/usr/bin/env python3
"""Query RUCT (Registro de Universidades, Centros y Titulos) from the command line.

RUCT is the authority on whether a Spanish master is OFFICIAL (`master universitario`)
or merely a `titulo propio`. Its web UI is a Struts form with no deep links, which is why
agents kept guessing official status instead of checking it. This drives the form directly.

Two things that are easy to get wrong and silently return zero rows:
  * an accented search term returns ZERO ROWS rather than an error -- "musica" finds 41
    titles, "musica" with its accent finds none. That failure looks exactly like "no such
    programme is registered", which is the most dangerous wrong answer this tool can give,
    so terms are accent-stripped automatically below;
  * the query string is encoded iso-8859-15, not utf-8;
  * the session cookie from consultaestudios must be established first.

Usage:
    python3 ruct.py "inteligencia artificial" "ciencia de datos"
    python3 ruct.py --universidad "Pompeu Fabra"
    python3 ruct.py --json "tecnologias del sonido"

Output columns: RUCT code, title, university, estado (BOE state).
An `estado` of "A EXTINGUIR" means the title is being wound down -- it may not accept a
2027 intake, which matters more than its mere presence in the register.
"""
import urllib.request, urllib.parse, re, html, http.cookiejar, sys, time, json, unicodedata

BASE = "https://www.educacion.gob.es/ruct/listaestudios"
SEED = "https://www.educacion.gob.es/ruct/consultaestudios?actual=estudios"

def _strip_accents(s):
    """RUCT returns zero rows for any accented term -- see module docstring."""
    return "".join(c for c in unicodedata.normalize("NFKD", s or "")
                   if not unicodedata.combining(c))

def _opener():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [("User-Agent", "Mozilla/5.0")]
    op.open(SEED, timeout=60).read()
    return op

def query(term, by="descripcionEstudio", tipo="M", op=None, pause=0.3):
    """Yield dicts for every RUCT row matching `term`. by='universidad' searches by uni.

    A fresh session is established per call on purpose. The Struts form keeps the previous
    query in server-side session state, so reusing one opener makes every term after the
    first silently return the FIRST term's result set -- which looks like a successful
    query and is the most dangerous failure mode this script has.
    """
    op = _opener()
    term = _strip_accents(term)
    seen, page = {}, 1
    while True:
        params = {by: term, "codigoTipo": tipo, "actual": "estudios",
                  "d-1335801-p": page, "historico": "false",
                  "action:listaestudios": "Consultar", "consulta": "1"}
        # iso-8859-15, not utf-8 -- see module docstring
        url = BASE + "?" + urllib.parse.urlencode(params, encoding="iso-8859-15",
                                                  errors="replace")
        data = op.open(url, timeout=60).read().decode("latin-1")
        m = re.search(r"(\d+) registros encontrados, mostrando (?:del (\d+) al (\d+)|todos)", data)
        for cls, row in re.findall(r'<tr class="([^"]*)">(.*?)</tr>', data, re.S):
            tds = re.findall(r"<td>(.*?)</td>", row, re.S)
            if len(tds) < 5:
                continue
            f = lambda x: " ".join(html.unescape(re.sub("<[^>]+>", "", x)).split())
            code = f(tds[0])
            if code and code not in seen:
                seen[code] = {"ruct_code": code, "title": f(tds[1]), "university": f(tds[2]),
                              "estado": f(tds[4]), "query_term": term}
        if not m or m.group(2) is None:
            break
        if int(m.group(3)) >= int(m.group(1)):
            break
        page += 1
        time.sleep(pause)
    return list(seen.values())

def main():
    args = sys.argv[1:]
    as_json = "--json" in args
    args = [a for a in args if a != "--json"]
    by = "descripcionEstudio"
    if args and args[0] == "--universidad":
        by, args = "universidad", args[1:]
    if not args:
        sys.exit(__doc__)
    out = {}
    for t in args:
        before = len(out)
        for r in query(t, by=by):
            out.setdefault(r["ruct_code"], r)
        print(f"--- {t}: +{len(out)-before} (total {len(out)})", file=sys.stderr)
    rows = sorted(out.values(), key=lambda r: r["ruct_code"])
    if as_json:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
    else:
        for r in rows:
            print("\t".join([r["ruct_code"], r["title"], r["university"], r["estado"]]))

if __name__ == "__main__":
    main()
