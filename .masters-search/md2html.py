import markdown, sys, re, pathlib
EMOJI = re.compile("[" 
    "\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F02F"
    "\U0001F0A0-\U0001F0FF\U00002190-\U000021FF\U00002B00-\U00002BFF"
    "\U0000FE00-\U0000FE0F\U00002700-\U000027BF\U000024C2\U0001F1E6-\U0001F1FF"
    "]+", flags=re.UNICODE)
CSS = """
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  font-size: 10.5pt; line-height: 1.5; color: #1f2933; margin: 0; }
h1 { font-size: 21pt; color: #10233f; margin: 0 0 4pt; padding-bottom: 6pt; border-bottom: 3px solid #2f6df6; line-height: 1.2; }
h2 { font-size: 14.5pt; color: #10233f; margin: 20pt 0 6pt; padding-bottom: 3pt; border-bottom: 1px solid #d0d7de; page-break-after: avoid; }
h3 { font-size: 12pt; color: #1a3a6b; margin: 14pt 0 4pt; page-break-after: avoid; }
p { margin: 5pt 0; }
a { color: #2f6df6; text-decoration: none; word-break: break-all; }
strong { color: #10233f; }
ul, ol { margin: 5pt 0; padding-left: 20pt; }
li { margin: 2.5pt 0; }
code { background: #eef1f5; padding: 1px 5px; border-radius: 4px; font-family: "SFMono-Regular", Consolas, monospace; font-size: 9pt; }
blockquote { margin: 8pt 0; padding: 7pt 12pt; background: #fff7e6; border-left: 4px solid #f5a623; border-radius: 3px; }
blockquote p { margin: 0; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9pt; }
th { background: #10233f; color: #fff; text-align: left; padding: 6pt 8pt; font-weight: 600; }
td { padding: 5pt 8pt; border-bottom: 1px solid #e2e6ea; vertical-align: top; }
tr:nth-child(even) td { background: #f6f8fa; }
tr { page-break-inside: avoid; }
hr { border: none; border-top: 1px solid #d0d7de; margin: 14pt 0; }
"""
src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
src = EMOJI.sub("", src)
src = re.sub(r' {2,}', ' ', src)
html_body = markdown.markdown(src, extensions=["tables","fenced_code","sane_lists","attr_list"])
title = sys.argv[3] if len(sys.argv)>3 else pathlib.Path(sys.argv[1]).stem
out = f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{html_body}</body></html>"""
pathlib.Path(sys.argv[2]).write_text(out, encoding="utf-8")
