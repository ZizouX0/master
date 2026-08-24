# Blocked sources and slices needing a redo

Kept as a live list so nothing quietly disappears. Everything here also lands in `gaps.md`.

## Domains that defeat every automated fetch available here
403 to WebFetch, curl (full browser headers), and headless Chromium alike. Chromium cannot
reach the session proxy at all (`ERR_CONNECTION_RESET` on every host, including example.com),
so a JS-capable fallback does **not** exist in this environment. The Wayback Machine is
rate-limited (429) and is not a workaround.

| Domain | Why it matters |
|---|---|
| `upf.edu` | **The single most important institution in the sweep** — Music Technology Group, the SMC master. Official status recovered from RUCT (4315538, renewed); fees/language/curriculum pages unread. |
| `www.ub.edu` / `web.ub.edu` | UB's **official master catalogue could not be enumerated at all**. Only the Data Science microsite and IL3 (títols propis) were reachable. Needs a human or a JS-capable fetcher. |
| `unir.net` | Recoverable via curl with full browser headers in some cases; 403 to WebFetch. |
| `il3.ub.edu`, `pointblankmusicschool.com`, `imep.es`, `upv.es` (rate-limits at 503), `ecam.es` | Partially or wholly unread. |
| `guiadocent.upf.edu`, `estudiospropios.unizar.es` | Refused by the **network gateway** (502 on CONNECT), not by the site. |

## Título propio catalogues not enumerated
Andalusian propios are only enumerated for **UGR, US, UCO**. Unreachable (503/500/JS-only):
**UMA, UCA, UJA, UHU, UAL, UPO**. Their own-certificate offerings are therefore missing —
which matters most for fields P and S, where propios dominate.

## Catalogues served client-side only
UPO and UAL resolve their master lists in JS, so per-programme URLs are `NOT FOUND` and the
Junta de Andalucía DUA register code is cited instead.

## Useful substitute registries found while working around the above
- **Junta de Andalucía DUA** — `sguit/?q=masteres&d=mo_catalogo.php`, 888 authorised entries
  across all 8 Andalusian public universities. A real cross-check where RUCT was not driven.
- **RUCT itself** — now scripted, see `.masters-search/spain/ruct.py`.

## Slices to redo or finish
- UB official masters (blocked).
- Point Blank Ibiza (403) — appears to top out at BA level, **not verified**.
- Catalan-language and título-propio sweeps for field A/B — dropped when a search budget ran out.
- Smaller telecom schools' internal DSP tracks (Cantabria, Zaragoza, EHU, Oviedo, USC, ULPGC,
  UPNA, Tecnun, UPCT): standalone titles ruled out via RUCT, internal tracks unchecked.
- RUCT's `Ingeniería Informática` result set was paginated and only partly screened for cloud
  especialidades by the field-AC agent — the backbone now covers the titles, but not which of
  them contain a cloud track.
