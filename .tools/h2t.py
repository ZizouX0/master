import sys, re, html, urllib.request, gzip, io, ssl
def totext(s):
    s = re.sub(r'(?is)<(script|style|noscript|svg|head)[^>]*>.*?</\1>', ' ', s)
    s = re.sub(r'(?is)<!--.*?-->', ' ', s)
    s = re.sub(r'(?i)<(br|/p|/div|/li|/tr|/h[1-6]|/table)[^>]*>', '\n', s)
    s = re.sub(r'(?i)<li[^>]*>', '\n- ', s)
    s = re.sub(r'(?i)<td[^>]*>', ' | ', s)
    s = re.sub(r'(?s)<[^>]+>', ' ', s)
    s = html.unescape(s)
    s = re.sub(r'[ \t\xa0]+', ' ', s)
    s = re.sub(r'\n\s*\n\s*\n+', '\n\n', s)
    return '\n'.join(l.strip() for l in s.split('\n')).strip()
if __name__ == '__main__':
    p = sys.argv[1]
    if p.startswith('http'):
        ctx=ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
        req=urllib.request.Request(p, headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36','Accept-Language':'pt-PT,pt,en'})
        data=urllib.request.urlopen(req, timeout=45, context=ctx).read()
        try: data=gzip.decompress(data)
        except Exception: pass
        s=data.decode('utf-8','ignore')
    else:
        s=open(p,encoding='utf-8',errors='ignore').read()
    print(totext(s))
