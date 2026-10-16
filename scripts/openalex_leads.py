import json, subprocess, urllib.parse, unicodedata, sys
names = [l.strip() for l in open(sys.argv[1]) if l.strip()]
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c)!='Mn')
out = {}
for full in names:
    parts = full.split()
    # search with first given name + two surnames
    q = f"{parts[0]} {parts[-2]} {parts[-1]}"
    url = "https://api.openalex.org/authors?per-page=10&search=" + urllib.parse.quote(q)
    r = subprocess.run(["curl","-s","-m","40",url],capture_output=True,text=True)
    try: res = json.loads(r.stdout).get("results",[])
    except Exception: res=[]
    hits=[]
    for a in res:
        insts = [i.get("display_name","") for i in (a.get("last_known_institutions") or [])]
        ids = [i.get("id","") for i in (a.get("last_known_institutions") or [])] + [x["institution"].get("id","") for x in (a.get("affiliations") or [])]
        affs = [x["institution"]["display_name"] for x in (a.get("affiliations") or [])]
        uni = any(i.endswith("I62520931") for i in ids)
        raws = [norm(x) for x in (a.get("raw_author_names") or [])] + [norm(a["display_name"]), norm(a.get("full_name") or "")]
        sur_ok = any(norm(parts[-2]) in r and norm(parts[-1]) in r and norm(parts[0]) in r for r in raws)
        if uni and sur_ok:
            hits.append({"openalex":a["id"],"display_name":a["display_name"],"full_name":a.get("full_name"),"orcid":a.get("orcid"),"works_count":a.get("works_count"),"cited_by_count":a.get("cited_by_count"),"institutions":sorted(set(insts+affs))[:5]})
    out[full]=hits
    print(full, "->", [(h["display_name"],h["works_count"],h["orcid"]) for h in hits], flush=True)
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False, indent=1)
