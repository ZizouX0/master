import json, os, sys
P = "/home/user/master/.masters-search/results/artist-sweep/nl-uk-ie-2.json"
FIELDS = ["_field","_source","country","city","institution","program","qualification",
 "accreditationStatus","institutionType","language","durationEcts","whatYouStudy",
 "entryRequirements","acceptsNonMusic","portfolioSpec","auditionSpec","tuitionNonEU",
 "otherFees","totalCostEstimate","scholarshipName","scholarships","languageRequirement",
 "englishTest","deadline","applicationOpens","sourceUrl"]
def load():
    return json.load(open(P)) if os.path.exists(P) else []
def add(newrows):
    rows = load()
    key = lambda r: (r.get("institution",""), r.get("program",""))
    have = {key(r) for r in rows}
    for r in newrows:
        r.setdefault("_source","artist-sweep-nl-uk-ie-2")
        for f in FIELDS: r.setdefault(f,"UNVERIFIED")
        r = {f: r[f] for f in FIELDS}
        if key(r) in have:
            rows = [r if key(x)==key(r) else x for x in rows]
        else:
            rows.append(r); have.add(key(r))
    json.dump(rows, open(P,"w"), indent=2, ensure_ascii=False)
    print("total:", len(rows))
if __name__ == "__main__":
    add(json.load(open(sys.argv[1])))
