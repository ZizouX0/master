import json, os, sys
P = "/home/user/master/.masters-search/results/artist-sweep/scholarships.json"
FIELDS = ["scholarshipName","provider","country","whoCanApply","ageLimit","subjectScope","coverage",
          "duration","numberOfAwards","deadline","applicationOpens","howToApply","requiresAdmissionFirst",
          "languageRequirement","competitiveness","sourceUrl","notes","_source"]
def load():
    if os.path.exists(P):
        return json.load(open(P))
    return []
def save(rows):
    json.dump(rows, open(P,"w"), indent=2, ensure_ascii=False)
def add(newrows):
    rows = load()
    have = {r["scholarshipName"] for r in rows}
    for r in newrows:
        r.setdefault("_source","artist-sweep-scholarships")
        for f in FIELDS:
            r.setdefault(f,"UNVERIFIED")
        r = {f: r[f] for f in FIELDS}
        if r["scholarshipName"] in have:
            rows = [r if x["scholarshipName"]==r["scholarshipName"] else x for x in rows]
        else:
            rows.append(r); have.add(r["scholarshipName"])
    save(rows)
    print("total:", len(rows))
if __name__ == "__main__":
    add(json.load(open(sys.argv[1])))
