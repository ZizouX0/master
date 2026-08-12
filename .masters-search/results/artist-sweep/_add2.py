import json,os,sys
P='/home/user/master/.masters-search/results/artist-sweep/central-eastern-2.json'
def load():
    if os.path.exists(P):
        return json.load(open(P))
    return []
def add(recs):
    d=load()
    for r in recs:
        r.setdefault('_source','artist-sweep-central-eastern-2')
    d.extend(recs)
    json.dump(d,open(P,'w'),ensure_ascii=False,indent=1)
    print('total',len(d))
