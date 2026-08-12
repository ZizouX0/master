import json, os, sys
P = "/home/user/master/.masters-search/results/artist-sweep/door3-scholarships.json"

def load():
    if os.path.exists(P):
        try:
            return json.load(open(P))
        except Exception:
            return []
    return []

def add(records):
    data = load()
    have = {(r.get("scholarshipName"), r.get("provider")) for r in data}
    n = 0
    for r in records:
        k = (r.get("scholarshipName"), r.get("provider"))
        if k in have:
            continue
        r.setdefault("_source", "door3-scholarships")
        data.append(r)
        have.add(k)
        n += 1
    json.dump(data, open(P, "w"), indent=1, ensure_ascii=False)
    print("added", n, "total", len(data))
    return len(data)

if __name__ == "__main__":
    add(json.load(open(sys.argv[1])))
