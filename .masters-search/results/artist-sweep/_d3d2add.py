import json, os, sys
P = "/home/user/master/.masters-search/results/artist-sweep/door3-dach-2.json"
new = json.load(open(sys.argv[1]))
cur = []
if os.path.exists(P):
    try:
        cur = json.load(open(P))
    except Exception:
        cur = []
for r in new:
    r.setdefault("_field", "B")
    r.setdefault("_source", "door3-dach-2")
    k = (r.get("institution"), r.get("program"))
    cur = [c for c in cur if (c.get("institution"), c.get("program")) != k]
    cur.append(r)
json.dump(cur, open(P, "w"), indent=1, ensure_ascii=False)
print("total", len(cur))
