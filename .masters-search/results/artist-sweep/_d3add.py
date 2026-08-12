import json, os, sys
P="/home/user/master/.masters-search/results/artist-sweep/door3-south.json"
def load():
    if os.path.exists(P):
        try: return json.load(open(P))
        except: return []
    return []
def save(recs):
    json.dump(recs, open(P,"w"), ensure_ascii=False, indent=1)
def add(new):
    recs=load()
    have={(r.get("institution"),r.get("program")) for r in recs}
    n=0
    for r in new:
        r.setdefault("_field","B"); r.setdefault("_source","door3-south")
        if (r.get("institution"),r.get("program")) in have: continue
        recs.append(r); have.add((r.get("institution"),r.get("program"))); n+=1
    save(recs); print("added",n,"total",len(recs))
if __name__=="__main__":
    add(json.load(open(sys.argv[1])))
