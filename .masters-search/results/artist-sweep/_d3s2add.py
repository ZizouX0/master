import json,sys,os
P='/home/user/master/.masters-search/results/artist-sweep/door3-south-2.json'
new=json.load(open(sys.argv[1]))
cur=[]
if os.path.exists(P):
    cur=json.load(open(P))
seen={(r.get('institution'),r.get('program')) for r in cur}
for r in new:
    r.setdefault('_field','B'); r.setdefault('_source','door3-south-2')
    k=(r.get('institution'),r.get('program'))
    if k in seen: 
        # replace
        cur=[c for c in cur if (c.get('institution'),c.get('program'))!=k]
    cur.append(r); seen.add(k)
json.dump(cur,open(P,'w'),indent=1,ensure_ascii=False)
print('total',len(cur))
