# import streamlit as st
# import pandas as pd
# import os

# st.set_page_config(page_title="Cadastro de Confrontos", layout="centered")
# st.title("📋 Cadastro Rápido de Confrontos por Rodada")

# # Função para carregar confrontos de um arquivo CSV
# def carregar_confrontos_csv(arquivo="confrontos_serie_C.csv"):
#     try:
#         if os.path.exists(arquivo):
#             df = pd.read_csv(arquivo)
#             if {"Rodada", "Confronto", "Time A", "Time B"}.issubset(df.columns):
#                 return df[["Rodada", "Confronto", "Time A", "Time B"]].values.tolist()
#     except Exception as e:
#         st.warning(f"Erro ao carregar confrontos salvos: {e}")
#     return []

# # Função para carregar times do Excel
# def carregar_times_excel(arquivo="times.xlsx"):
#     try:
#         df_times = pd.read_excel(arquivo, sheet_name="Times")
#         return sorted(df_times["Nome"].dropna().unique().tolist())
#     except Exception:
#         st.warning("Arquivo de times não encontrado ou com erro. Adicione manualmente.")
#         return []

# # Inicializar session_state
# if "confrontos" not in st.session_state:
#     st.session_state.confrontos = carregar_confrontos_csv()
# if "confrontos_por_rodada" not in st.session_state:
#     st.session_state.confrontos_por_rodada = len(st.session_state.confrontos)
# if "times" not in st.session_state:
#     st.session_state.times = carregar_times_excel()

# # Adicionar novo time
# with st.expander("➕ Cadastrar novo time"):
#     novo_time = st.text_input("Nome do novo time:")
#     if st.button("Adicionar time"):
#         if novo_time and novo_time not in st.session_state.times:
#             st.session_state.times.append(novo_time)
#             st.session_state.times = sorted(st.session_state.times)
#             st.success(f"Time '{novo_time}' adicionado!")
#         elif novo_time in st.session_state.times:
#             st.warning("Esse time já foi cadastrado.")

# # Cálculo automático da rodada e confronto
# rodada_atual = st.session_state.confrontos_por_rodada // 10 + 1
# confronto_atual = st.session_state.confrontos_por_rodada % 10 + 1

# if rodada_atual > 19:
#     st.error("Limite de 19 rodadas alcançado.")
# else:
#     st.subheader(f"🕹️ Rodada {rodada_atual} - Confronto {confronto_atual}")

#     col1, col2 = st.columns(2)

#     if "select_time_a" not in st.session_state:
#         st.session_state.select_time_a = ""
#     if "select_time_b" not in st.session_state:
#         st.session_state.select_time_b = ""

#     with col1:
#         st.session_state.select_time_a = st.selectbox(
#             "Time A", options=[""] + st.session_state.times, index=0
#         )
#     with col2:
#         st.session_state.select_time_b = st.selectbox(
#             "Time B", options=[""] + st.session_state.times, index=0
#         )

#     # Botão para salvar confronto
#     if st.button("Salvar Confronto"):
#         time_a = st.session_state.select_time_a
#         time_b = st.session_state.select_time_b

#         if not time_a or not time_b:
#             st.warning("Selecione dois times para registrar o confronto.")
#         elif time_a == time_b:
#             st.warning("Time A e Time B não podem ser iguais.")
#         else:
#             st.session_state.confrontos.append([rodada_atual, confronto_atual, time_a, time_b])
#             st.session_state.confrontos_por_rodada += 1
#             st.success(f"Confronto salvo: {time_a} x {time_b} (Rodada {rodada_atual})")

#             # Resetar seleções
#             st.session_state.select_time_a = ""
#             st.session_state.select_time_b = ""

# # Exibir confrontos
# if st.session_state.confrontos:
#     df = pd.DataFrame(st.session_state.confrontos, columns=["Rodada", "Confronto", "Time A", "Time B"])
#     todos_times = pd.unique(df[["Time A", "Time B"]].values.ravel())
#     id_times = {time: idx + 1 for idx, time in enumerate(sorted(todos_times))}
#     df["ID A"] = df["Time A"].map(id_times)
#     df["ID B"] = df["Time B"].map(id_times)

#     st.subheader("📊 Tabela de Confrontos Cadastrados")
#     st.dataframe(df)

#     csv = df.to_csv(index=False).encode('utf-8')
#     st.download_button("⬇️ Baixar confrontos em CSV", csv, "confrontos.csv", "text/csv")

import streamlit as st
import pandas as pd
import os
from pathlib import Path

st.set_page_config(page_title="Cadastro de Confrontos", layout="centered")
st.title("📋 Cadastro Rápido de Confrontos por Rodada")

ARQ_CONFRONTOS = "confrontos_serie_C.csv"
ARQ_TIMES = str(Path(__file__).resolve().parent / "times.xlsx")
ABA_TIMES = "Times"

# -------------------------
# Persistência de Times (Excel)
# -------------------------
def garantir_arquivo_times(arquivo=ARQ_TIMES, aba=ABA_TIMES):
    """
    Garante que existe um arquivo Excel com a aba 'Times' e a coluna 'Nome'.
    Se não existir, cria.
    """
    if not os.path.exists(arquivo):
        df = pd.DataFrame({"Nome": []})
        with pd.ExcelWriter(arquivo, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=aba, index=False)
        return

    # Se existir, checa se tem a aba/coluna
    try:
        xls = pd.ExcelFile(arquivo)
        if aba not in xls.sheet_names:
            # cria a aba mantendo outras abas
            with pd.ExcelWriter(arquivo, engine="openpyxl", mode="a", if_sheet_exists="new") as writer:
                pd.DataFrame({"Nome": []}).to_excel(writer, sheet_name=aba, index=False)
        else:
            df = pd.read_excel(arquivo, sheet_name=aba)
            if "Nome" not in df.columns:
                # recria a aba com coluna correta (mantém outras abas)
                df_fix = pd.DataFrame({"Nome": df.iloc[:, 0].astype(str).tolist()}) if len(df.columns) > 0 else pd.DataFrame({"Nome": []})
                with pd.ExcelWriter(arquivo, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
                    df_fix.to_excel(writer, sheet_name=aba, index=False)
    except Exception:
        # Se deu ruim na leitura (arquivo corrompido etc), cria um novo "limpo"
        df = pd.DataFrame({"Nome": []})
        with pd.ExcelWriter(arquivo, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name=aba, index=False)

def salvar_novo_time_excel(novo_time: str, arquivo=ARQ_TIMES, aba=ABA_TIMES) -> bool:
    """
    Salva um novo time no Excel (aba 'Times', coluna 'Nome') se ainda não existir.
    Retorna True se salvou, False se já existia.
    """
    garantir_arquivo_times(arquivo, aba)

    df = pd.read_excel(arquivo, sheet_name=aba)
    # normaliza para comparação (mantém nome original que você digitar)
    existentes = set(df["Nome"].dropna().astype(str).str.strip().tolist())

    nome = str(novo_time).strip()
    if not nome:
        return False

    if nome in existentes:
        return False

    df_out = pd.concat([df, pd.DataFrame({"Nome": [nome]})], ignore_index=True)

    with pd.ExcelWriter(arquivo, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
        df_out.to_excel(writer, sheet_name=aba, index=False)

    return True

# -------------------------
# Confrontos
# -------------------------
def carregar_confrontos_csv(arquivo=ARQ_CONFRONTOS):
    try:
        if os.path.exists(arquivo):
            df = pd.read_csv(arquivo)
            if {"Rodada", "Confronto", "Time A", "Time B"}.issubset(df.columns):
                return df[["Rodada", "Confronto", "Time A", "Time B"]].values.tolist()
    except Exception as e:
        st.warning(f"Erro ao carregar confrontos salvos: {e}")
    return []

def carregar_times_excel(arquivo=ARQ_TIMES):
    try:
        garantir_arquivo_times(arquivo, ABA_TIMES)
        df_times = pd.read_excel(arquivo, sheet_name=ABA_TIMES)
        return sorted(df_times["Nome"].dropna().astype(str).str.strip().unique().tolist())
    except Exception:
        st.warning("Arquivo de times não encontrado ou com erro. Adicione manualmente.")
        return []

# Inicializar session_state
if "confrontos" not in st.session_state:
    st.session_state.confrontos = carregar_confrontos_csv()
if "confrontos_por_rodada" not in st.session_state:
    st.session_state.confrontos_por_rodada = len(st.session_state.confrontos)
if "times" not in st.session_state:
    st.session_state.times = carregar_times_excel()

# Adicionar novo time
with st.expander("➕ Cadastrar novo time"):
    novo_time = st.text_input("Nome do novo time:")
    if st.button("Adicionar time"):
        nome = (novo_time or "").strip()
        if not nome:
            st.warning("Informe um nome válido.")
        elif nome in st.session_state.times:
            st.warning("Esse time já foi cadastrado.")
        else:
            # 1) salva no Excel (persistência)
            salvou = salvar_novo_time_excel(nome)
            # 2) atualiza lista em memória
            st.session_state.times.append(nome)
            st.session_state.times = sorted(set(st.session_state.times))
            if salvou:
                st.success(f"Time '{nome}' adicionado e salvo no times.xlsx!")
            else:
                st.success(f"Time '{nome}' adicionado!")

# Cálculo automático da rodada e confronto
rodada_atual = st.session_state.confrontos_por_rodada // 10 + 1
confronto_atual = st.session_state.confrontos_por_rodada % 10 + 1

if rodada_atual > 19:
    st.error("Limite de 19 rodadas alcançado.")
else:
    st.subheader(f"🕹️ Rodada {rodada_atual} - Confronto {confronto_atual}")

    col1, col2 = st.columns(2)

    if "select_time_a" not in st.session_state:
        st.session_state.select_time_a = ""
    if "select_time_b" not in st.session_state:
        st.session_state.select_time_b = ""

    with col1:
        st.session_state.select_time_a = st.selectbox(
            "Time A", options=[""] + st.session_state.times, index=0
        )
    with col2:
        st.session_state.select_time_b = st.selectbox(
            "Time B", options=[""] + st.session_state.times, index=0
        )

    # Botão para salvar confronto
    if st.button("Salvar Confronto"):
        time_a = st.session_state.select_time_a
        time_b = st.session_state.select_time_b

        if not time_a or not time_b:
            st.warning("Selecione dois times para registrar o confronto.")
        elif time_a == time_b:
            st.warning("Time A e Time B não podem ser iguais.")
        else:
            st.session_state.confrontos.append([rodada_atual, confronto_atual, time_a, time_b])
            st.session_state.confrontos_por_rodada += 1
            st.success(f"Confronto salvo: {time_a} x {time_b} (Rodada {rodada_atual})")

            # Resetar seleções
            st.session_state.select_time_a = ""
            st.session_state.select_time_b = ""

# Exibir confrontos
if st.session_state.confrontos:
    df = pd.DataFrame(st.session_state.confrontos, columns=["Rodada", "Confronto", "Time A", "Time B"])
    todos_times = pd.unique(df[["Time A", "Time B"]].values.ravel())
    id_times = {time: idx + 1 for idx, time in enumerate(sorted(todos_times))}
    df["ID A"] = df["Time A"].map(id_times)
    df["ID B"] = df["Time B"].map(id_times)

    st.subheader("📊 Tabela de Confrontos Cadastrados")
    st.dataframe(df)

    # (Opcional) salvar automaticamente no CSV do projeto, além do download
    try:
        df.to_csv(ARQ_CONFRONTOS, index=False, encoding="utf-8")
    except Exception as e:
        st.warning(f"Não consegui salvar automaticamente em {ARQ_CONFRONTOS}: {e}")

    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button("⬇️ Baixar confrontos em CSV", csv, "confrontos.csv", "text/csv")
