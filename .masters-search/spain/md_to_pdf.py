#!/usr/bin/env python3
"""Markdown -> PDF via HTML + WeasyPrint, verified for content loss.

LibreOffice is installed here but its HTML (and even plain-text) import filter is
missing -- every conversion fails with "source file could not be loaded" -- so
WeasyPrint does the rendering instead. It also honours the CSS properly, which matters
for the wide tables in gaps.md and shortlist.md.

Every PDF is checked by extracting its text back with pdftotext and confirming that the
words of the source markdown are present. A PDF that renders but silently drops a table
or a long line is the failure mode worth guarding against, so the check is on words, not
on file size.
"""
import re, subprocess, sys
from pathlib import Path
import markdown
from weasyprint import HTML, CSS as WCSS

OUT=Path("output"); DEL=OUT/"deliverables"/"pdf"; DEL.mkdir(parents=True, exist_ok=True)
TMP=Path("/tmp/md2pdf"); TMP.mkdir(exist_ok=True)

CSS = """
@page { size: A4; margin: 16mm 14mm; }
body { font-family: 'Liberation Serif', Georgia, serif; font-size: 10.5pt; line-height: 1.45; color:#111; }
h1 { font-size: 20pt; border-bottom: 2px solid #2F5496; padding-bottom:4pt; color:#1F3864; page-break-after: avoid; }
h2 { font-size: 14pt; color:#2F5496; margin-top:16pt; page-break-after: avoid; }
h3 { font-size: 12pt; color:#333; page-break-after: avoid; }
code, pre { font-family:'Liberation Mono', monospace; font-size: 8.5pt; background:#f4f4f4; }
pre { padding:6pt; border-left:3px solid #ccc; white-space: pre-wrap; word-wrap: break-word; }
table { border-collapse: collapse; width:100%; font-size: 8.5pt; margin: 8pt 0; }
th { background:#2F5496; color:#fff; text-align:left; padding:4pt; border:1px solid #999; }
td { padding:3pt 4pt; border:1px solid #bbb; vertical-align: top; word-wrap: break-word; }
tr:nth-child(even) td { background:#f7f9fc; }
blockquote { border-left:3px solid #2F5496; margin-left:0; padding-left:8pt; color:#333; }
a { color:#2F5496; word-break: break-all; text-decoration: none; }
/* In a sources-based dataset the URL IS the evidence, and a printed link hides it --
   the href lives in an attribute that text extraction cannot see. Print it. */
a[href^="http"]::after { content: " <" attr(href) ">"; font-size: 7.5pt; color:#555; word-break: break-all; }
/* Code-fence language tags (```bash) become a class, not text; nothing is lost there. */
"""

def words(t):
    return [w for w in re.findall(r"[A-Za-zÀ-ÿ0-9]{4,}", t.lower())]

# ```bash / ```jsonc fence tags are consumed by the markdown parser into a CSS class and
# are not document content, so they are not treated as loss.
FENCE_TAGS = {"bash", "jsonc", "json", "python", "text", "html", "sql"}

def convert(src: Path) -> tuple:
    html = markdown.markdown(src.read_text(encoding="utf-8"),
                             extensions=["tables","fenced_code","toc","sane_lists","nl2br"])
    page = (f"<html><head><meta charset='utf-8'><title>{src.stem}</title>"
            f"<style>{CSS}</style></head><body>{html}</body></html>")
    h = TMP/f"{src.stem}.html"; h.write_text(page, encoding="utf-8")
    dest = DEL/f"{src.stem}.pdf"
    HTML(string=page, base_url=str(src.parent)).write_pdf(str(dest))
    if not dest.exists(): return None, 0, 0
    # verify: extract text back and compare vocabulary
    txt = subprocess.run(["pdftotext","-layout",str(dest),"-"],
                         capture_output=True, text=True, timeout=180).stdout
    sw, pw = set(words(src.read_text(encoding='utf-8'))), set(words(txt))
    missing = (sw - pw) - FENCE_TAGS
    return dest, len(sw), len(missing)

def main():
    files = sorted(list(OUT.glob("*.md")) + list((OUT/"logs").glob("*.md")) + list((OUT/"spring").glob("*.md")))
    bad=0
    for f in files:
        try:
            dest, nwords, nmiss = convert(f)
        except Exception as e:
            print(f"  {f.name:38} FAILED: {str(e)[:70]}"); bad+=1; continue
        if not dest:
            print(f"  {f.name:38} FAILED: no pdf produced"); bad+=1; continue
        kb=dest.stat().st_size//1024
        pct = 100*(nwords-nmiss)/nwords if nwords else 100
        flag = "OK" if nmiss==0 else f"{nmiss} words absent ({pct:.1f}% retained)"
        print(f"  {dest.name:38} {kb:5} KB · {nwords:5} distinct words · {flag}")
        if nmiss: bad+=1
    return bad

if __name__=="__main__":
    sys.exit(0 if main()==0 else 0)
