import time
from typing import Dict, Iterable, Optional, Set

import requests

# Shared headers for Cartola API requests.
# Notebooks can overwrite this: parciais.HEADERS = HEADERS
HEADERS: Dict[str, str] = {}


def set_headers(headers: Dict[str, str]) -> None:
    global HEADERS
    HEADERS = headers or {}


def fetch_pontuados(timeout: int = 15) -> Dict[int, float]:
    url = "https://api.cartola.globo.com/atletas/pontuados"
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code != 200:
            return {}
        data = r.json()
        atletas = data.get("atletas", {}) if isinstance(data, dict) else {}
        if not isinstance(atletas, dict):
            return {}
        out: Dict[int, float] = {}
        for k, v in atletas.items():
            try:
                atleta_id = int(k)
                pont = v.get("pontuacao") if isinstance(v, dict) else None
                if pont is None:
                    continue
                out[atleta_id] = float(pont)
            except Exception:
                continue
        return out
    except Exception:
        return {}


def fetch_time_payload(time_id: int, rodada: int, timeout: int = 15) -> Dict:
    endpoints = [
        f"https://api.cartolafc.globo.com/time/id/{time_id}/{rodada}",
        f"https://api.cartolafc.globo.com/time/{time_id}/{rodada}",
    ]

    for url in endpoints:
        for tentativa in range(3):
            try:
                r = requests.get(url, headers=HEADERS, timeout=timeout)
                if r.status_code == 429:
                    time.sleep(0.8 + tentativa * 0.8)
                    continue
                if r.status_code != 200:
                    break
                data = r.json()
                if not isinstance(data, dict):
                    data = {}
                return data
            except Exception:
                time.sleep(0.5)
                continue
    return {}


def fetch_partidas_rodada(rodada: int, timeout: int = 15) -> Iterable[dict]:
    url = f"https://api.cartolafc.globo.com/partidas/{rodada}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        if r.status_code != 200:
            return []
        data = r.json()
        if isinstance(data, dict):
            partidas = data.get("partidas", [])
            return partidas if isinstance(partidas, list) else []
    except Exception:
        pass
    return []


def partida_valida(p: dict) -> bool:
    if not isinstance(p, dict):
        return False
    # Alguns campos conhecidos para indicar partida invalida para a rodada
    for key in (
        "valida",
        "valida_para_rodada",
        "valida_para_a_rodada",
        "jogo_valido",
        "jogo_valido_para_rodada",
        "valida_cartola",
        "valido",
    ):
        if key in p:
            try:
                v = p.get(key)
                if isinstance(v, str):
                    v = v.strip().lower()
                    if v in ("false", "0", "nao", "não"):
                        return False
                    if v in ("true", "1", "sim"):
                        return True
                return bool(v)
            except Exception:
                continue
    # Sem indicador explicito, assume valida
    return True


def clubes_que_ja_jogaram(rodada: int) -> Set[int]:
    partidas = fetch_partidas_rodada(rodada)
    clubes: Set[int] = set()
    for p in partidas:
        if not isinstance(p, dict):
            continue
        if not partida_valida(p):
            continue
        status = (p.get("status_transmissao_tr") or p.get("status_transmissao") or "").upper()
        encerrada = status in ("ENCERRADA", "FINALIZADA")
        if p.get("placar_oficial_mandante") is not None or p.get("placar_oficial_visitante") is not None:
            encerrada = True
        if encerrada:
            mid = p.get("clube_casa_id")
            vid = p.get("clube_visitante_id")
            try:
                if mid is not None:
                    clubes.add(int(mid))
            except Exception:
                pass
            try:
                if vid is not None:
                    clubes.add(int(vid))
            except Exception:
                pass
    return clubes


def clubes_da_rodada(rodada: int) -> Set[int]:
    partidas = fetch_partidas_rodada(rodada)
    clubes: Set[int] = set()
    for p in partidas:
        if not isinstance(p, dict):
            continue
        if not partida_valida(p):
            continue
        mid = p.get("clube_casa_id")
        vid = p.get("clube_visitante_id")
        try:
            if mid is not None:
                clubes.add(int(mid))
        except Exception:
            pass
        try:
            if vid is not None:
                clubes.add(int(vid))
        except Exception:
            pass
    return clubes


def setor_por_posicao(posicao_id: int) -> str:
    mapa = {
        1: "Goleiro",
        2: "Laterais",
        3: "Zagueiros",
        4: "Meias",
        5: "Atacantes",
        6: "Tecnico",
    }
    try:
        return mapa.get(int(posicao_id), "")
    except Exception:
        return ""


def _id_int(val) -> Optional[int]:
    try:
        return int(val)
    except Exception:
        return None


def _calcular_parcial_core(
    time_id: int,
    rodada: int,
    mapa_pontuados: Dict[int, float],
    clubes_jogaram: Set[int],
    track_subs: bool = False,
):
    data = fetch_time_payload(time_id, rodada)
    atletas = data.get("atletas") if isinstance(data, dict) else None
    if not isinstance(atletas, list):
        return 0.0

    titulares = []
    tecnico = None
    for a in atletas:
        if not isinstance(a, dict):
            continue
        pos = a.get("posicao_id")
        if pos == 6:
            tecnico = a
        else:
            titulares.append(a)

    luxo_id = data.get("reserva_luxo_id") if isinstance(data, dict) else None
    if luxo_id is not None:
        luxo_id = _id_int(luxo_id)

    # Capitao (1.5x)
    capitao_id = None
    try:
        capitao_id = data.get("capitao_id") if isinstance(data, dict) else None
        if capitao_id is None and isinstance(data.get("time"), dict):
            capitao_id = data["time"].get("capitao_id")
        capitao_id = _id_int(capitao_id)
    except Exception:
        capitao_id = None

    titulares_por_pos = {}
    for a in titulares:
        pos = a.get("posicao_id")
        titulares_por_pos.setdefault(pos, []).append(a)

    clubes_na_rodada = clubes_da_rodada(rodada)

    atletas_em_jogo = list(titulares)
    subs_banco = []

    reservas = data.get("reservas", []) if isinstance(data, dict) else []
    if isinstance(reservas, list):
        for r in reservas:
            if not isinstance(r, dict):
                continue
            # reserva de luxo nao entra como banco
            if luxo_id is not None and _id_int(r.get("atleta_id")) == luxo_id:
                continue
            # banco so entra se reserva tiver pontuacao parcial positiva
            rid = _id_int(r.get("atleta_id"))
            if rid is None or rid not in mapa_pontuados:
                continue
            if float(mapa_pontuados.get(rid, 0.0)) <= 0.0:
                continue
            pos = r.get("posicao_id")
            if pos is None:
                continue
            candidatos = titulares_por_pos.get(pos, [])
            titular_sub = None
            for t in candidatos:
                tid = _id_int(t.get("atleta_id"))
                if tid is None:
                    continue
                clube_tid = _id_int(t.get("clube_id"))
                clube_sem_jogo = clube_tid is not None and clube_tid not in clubes_na_rodada
                if tid not in mapa_pontuados and (clube_tid in clubes_jogaram or clube_sem_jogo):
                    titular_sub = t
                    break
            if titular_sub is None:
                continue
            try:
                atletas_em_jogo.remove(titular_sub)
            except ValueError:
                pass
            atletas_em_jogo.append(r)
            if track_subs:
                subs_banco.append((titular_sub.get("atleta_id"), r.get("atleta_id"), pos))

    # Reserva de luxo
    sub_luxo = None
    luxo_capitao = False
    if luxo_id is not None:
        ids_em_jogo = set()
        for a in atletas_em_jogo:
            ids_em_jogo.add(_id_int(a.get("atleta_id")))
        if luxo_id not in ids_em_jogo:
            luxo_obj = None
            if isinstance(reservas, list):
                for r in reservas:
                    if isinstance(r, dict) and _id_int(r.get("atleta_id")) == luxo_id:
                        luxo_obj = r
                        break
            if isinstance(luxo_obj, dict):
                p_luxo = float(mapa_pontuados.get(luxo_id, 0.0))
                if p_luxo > 0:
                    setor_luxo = setor_por_posicao(luxo_obj.get("posicao_id"))
                    candidatos_setor = []
                    for a in atletas_em_jogo:
                        if setor_por_posicao(a.get("posicao_id")) == setor_luxo:
                            candidatos_setor.append(a)
                    if candidatos_setor:
                        # luxo so entra se TODOS do setor ja jogaram
                        todos_setor_jogaram = True
                        for c in candidatos_setor:
                            clube_c = _id_int(c.get("clube_id"))
                            clube_sem_jogo = clube_c is not None and clube_c not in clubes_na_rodada
                            if clube_c not in clubes_jogaram and not clube_sem_jogo:
                                todos_setor_jogaram = False
                                break
                        if todos_setor_jogaram:
                            def pts(a):
                                try:
                                    return float(mapa_pontuados.get(int(a.get("atleta_id")), 0.0))
                                except Exception:
                                    return 0.0

                            pior_pts = None
                            piores = []
                            for c in candidatos_setor:
                                v = pts(c)
                                if pior_pts is None or v < pior_pts:
                                    pior_pts = v
                                    piores = [c]
                                elif v == pior_pts:
                                    piores.append(c)
                            pior = None
                            if len(piores) > 1 and capitao_id is not None:
                                for c in piores:
                                    if _id_int(c.get("atleta_id")) == capitao_id:
                                        pior = c
                                        break
                            if pior is None:
                                pior = piores[0] if piores else None
                            if pior is not None and p_luxo > pts(pior):
                                if capitao_id is not None and _id_int(pior.get("atleta_id")) == capitao_id:
                                    luxo_capitao = True
                                try:
                                    atletas_em_jogo.remove(pior)
                                except ValueError:
                                    pass
                                atletas_em_jogo.append(luxo_obj)
                                if track_subs:
                                    sub_luxo = (pior.get("atleta_id"), luxo_id, setor_luxo)

    total = 0.0
    for a in atletas_em_jogo:
        try:
            aid = int(a.get("atleta_id"))
        except Exception:
            continue
        total += float(mapa_pontuados.get(aid, 0.0))

    # Bonus do capitao (50%)
    if capitao_id is not None:
        ids_em_jogo = set()
        for a in atletas_em_jogo:
            ids_em_jogo.add(_id_int(a.get("atleta_id")))
        if capitao_id in ids_em_jogo:
            cap_pts = float(mapa_pontuados.get(capitao_id, 0.0))
            total += cap_pts * 0.5
        elif luxo_capitao and luxo_id is not None and luxo_id in ids_em_jogo:
            luxo_pts = float(mapa_pontuados.get(luxo_id, 0.0))
            total += luxo_pts * 0.5

    if isinstance(tecnico, dict):
        try:
            tid = int(tecnico.get("atleta_id"))
            total += float(mapa_pontuados.get(tid, 0.0))
        except Exception:
            pass

    total_final = round(total, 2)
    if track_subs:
        return total_final, subs_banco, sub_luxo
    return total_final


def calcular_parcial_time(
    time_id: int,
    rodada: int,
    mapa_pontuados: Dict[int, float],
    clubes_jogaram: Set[int],
) -> float:
    return _calcular_parcial_core(time_id, rodada, mapa_pontuados, clubes_jogaram, track_subs=False)


def calcular_parcial_time_detalhado(
    time_id: int,
    rodada: int,
    mapa_pontuados: Dict[int, float],
    clubes_jogaram: Set[int],
):
    return _calcular_parcial_core(time_id, rodada, mapa_pontuados, clubes_jogaram, track_subs=True)
