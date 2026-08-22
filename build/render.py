"""HTML -> PDF via headless Chromium, plus the shared house style.

Chromium rather than reportlab because these documents are typographic — the
dossier template repeats a fixed grid 14 times and CSS keeps that honest.
"""
import subprocess, glob, os, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT  = ROOT / "deliverables" / "tools"
SCRATCH = Path(os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-master/"
          "d8502850-c13e-59a0-a925-e8a544107111/scratchpad"))

def chrome():
    for c in glob.glob("/opt/pw-browsers/chromium*/chrome-linux/chrome"):
        return c
    raise RuntimeError("chromium not found")

def esc(s):
    return html.escape(str(s or ""), quote=False)

CSS = """
:root{--ink:#16161E;--accent:#E0603A;--muted:#5C5C68;--rule:#D8D4CE;
      --paper:#FFFFFF;--wash:#F7F5F2;--ok:#3F6B5C;--warn:#B8672A;--bad:#C2451F}
*{box-sizing:border-box}
@page{size:A4 landscape;margin:13mm 15mm 15mm 15mm}
body{margin:0;font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
     color:var(--ink);font-size:10.2pt;line-height:1.5;background:var(--paper)}
h1,h2,h3,h4{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-weight:600;
     letter-spacing:-0.01em;margin:0 0 .35em}
h1{font-size:26pt;line-height:1.1}
h2{font-size:15pt;margin-top:1.1em;padding-bottom:.22em;border-bottom:1.5px solid var(--accent)}
h3{font-size:11.6pt;margin-top:.85em}
p{margin:0 0 .55em}
a{color:var(--accent);text-decoration:none;word-break:break-all}
.small{font-size:8.6pt;color:var(--muted);line-height:1.42}
.tiny{font-size:7.6pt;color:var(--muted);line-height:1.38}
.mono{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:8.4pt}
.page{page-break-after:always;position:relative;min-height:170mm}
.page:last-child{page-break-after:auto}
.pnum{position:running(x)}
.kicker{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:7.6pt;
     letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:.5em}
.lede{font-size:11.4pt;line-height:1.55;color:var(--ink);max-width:62em}
.rule{height:1.5px;background:var(--accent);margin:.7em 0 1em;border:0}
.cols2{column-count:2;column-gap:11mm}
.cols3{column-count:3;column-gap:9mm}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm}
.card{background:var(--wash);border-left:2.5px solid var(--accent);padding:3.4mm 4mm;
      break-inside:avoid}
.card h3{margin-top:0}
table{border-collapse:collapse;width:100%;font-size:8.8pt;break-inside:auto}
th{text-align:left;font-size:7.6pt;letter-spacing:.1em;text-transform:uppercase;
   color:var(--muted);border-bottom:1.2px solid var(--ink);padding:2mm 2.4mm;font-weight:600}
td{padding:1.9mm 2.4mm;border-bottom:.6px solid var(--rule);vertical-align:top}
tr{break-inside:avoid}
thead{display:table-header-group}
.badge{display:inline-block;padding:.6mm 2mm;border-radius:2mm;font-size:7.4pt;
   font-family:"SF Mono",Menlo,monospace;color:#fff;letter-spacing:.04em}
.chip{display:inline-block;padding:.5mm 1.8mm;border:.8px solid var(--rule);
   border-radius:1.5mm;font-size:7.4pt;color:var(--muted);margin-right:1mm}
.v-VERIFIED{background:var(--ok)}
.v-PARTIALLY_VERIFIED{background:var(--warn)}
.v-UNVERIFIED,.v-CONFLICT,.v-DEAD_LINK{background:var(--bad)}
.num{font-variant-numeric:tabular-nums}
.foot{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;
      font-size:7.4pt;color:var(--muted);border-top:.6px solid var(--rule);padding-top:1.6mm}
ul{margin:.2em 0 .6em;padding-left:1.1em}li{margin-bottom:.22em}
.warnbox{background:#FCEEE9;border-left:2.5px solid var(--bad);padding:3mm 4mm;break-inside:avoid}
.okbox{background:#EEF3F0;border-left:2.5px solid var(--ok);padding:3mm 4mm;break-inside:avoid}
.nobreak{break-inside:avoid}
"""

def page_footer(left, page_no, total=None):
    right = f"page {page_no}" + (f" of {total}" if total else "")
    return f'<div class="foot"><span>{esc(left)}</span><span class="num">{right}</span></div>'

def document(title, body, extra_css=""):
    return (f"<!doctype html><html><head><meta charset='utf-8'><title>{esc(title)}</title>"
            f"<style>{CSS}{extra_css}</style></head><body>{body}</body></html>")

def to_pdf(html_text, out_name):
    OUT.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)
    src = SCRATCH / (out_name.replace(".pdf", "") + ".html")
    src.write_text(html_text, encoding="utf-8")
    dst = OUT / out_name
    r = subprocess.run([chrome(), "--headless", "--disable-gpu", "--no-sandbox",
                        "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
                        "--virtual-time-budget=12000",
                        f"--print-to-pdf={dst}", f"file://{src}"],
                       capture_output=True, text=True, timeout=180)
    if not dst.exists():
        raise RuntimeError(f"chromium produced no pdf: {r.stderr[-800:]}")
    return dst
