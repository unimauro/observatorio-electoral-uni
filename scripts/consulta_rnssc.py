import json, subprocess, sys, unicodedata, time
URL = "https://www.sanciones.gob.pe/rnssc-rest/rest/sancion/consultar"
def n(s): return ' '.join(''.join(c for c in unicodedata.normalize('NFD', s or '') if unicodedata.category(c) != 'Mn').upper().split())
cands = json.load(open(sys.argv[1]))
out = []
for c in cands:
    parts = c['name'].split()
    pat, mat, nom = parts[-2], parts[-1], ' '.join(parts[:-2])
    body = {"jsonEntrada": {"ipCliente": "1.1.1.1", "tipoDocumento": "", "numeroDocumento": "", "nombres": "",
            "apellidoPaterno": n(pat), "apellidoMaterno": n(mat), "tipoConsulta": "EXT_TRANS"}}
    r = subprocess.run(["curl", "-s", "-m", "90", "-X", "POST", URL, "-H", "Content-Type: application/json; charset=UTF-8",
                        "-H", "Origin: https://www.sanciones.gob.pe", "-A", "Mozilla/5.0", "-d", json.dumps(body)], capture_output=True, text=True)
    try: data = (json.loads(r.stdout) or {}).get("data") or []
    except Exception: data = None
    exact = []
    if data:
        for rec in data:
            s = rec.get("servidorSancionado") or {}
            if n(s.get("apellidoPaterno")) == n(pat) and n(s.get("apellidoMaterno")) == n(mat) and n(s.get("nombres")) == n(nom):
                e = rec.get("entidadSancionadora") or {}
                exact.append({"entidad": e.get("razonSocial"), "tipo": (rec.get("tipoSancion") or {}).get("nombreParametro"),
                              "causa": (rec.get("causaSancion") or {}).get("nombreParametro"), "inicio": rec.get("fechaInicio"),
                              "fin": rec.get("fechaFin"), "estado": rec.get("estadoSancion")})
    status = "error" if data is None else "ok"
    out.append({"id": c['id'], "name": c['name'], "query": f"{n(pat)} {n(mat)}", "http": status,
                "surnameHits": 0 if not data else len(data), "exact": exact})
    print(c['id'], c['name'], '| consulta', status, '| registros con esos apellidos:', 0 if not data else len(data), '| coincidencia exacta:', len(exact), flush=True)
    time.sleep(1.5)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
