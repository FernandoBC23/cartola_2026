import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent

# Lista padrao: notebooks de competicoes (ajuste se quiser).
DEFAULT_NOTEBOOKS = [
    r"liga_eliminacao/datasets_liga_eliminacao/busca_dados_liga_eliminacao.ipynb",
    r"liga_eliminacao/datasets_liga_eliminacao/busca_dados_liga_eliminacao_20.ipynb",
    r"liga_classica/datasets_liga_classica/busca_dados_liga_classica.ipynb",
    r"liga_classica/datasets_liga_classica/busca_dados_liga_classica_aluna.ipynb",
    r"pontos_corridos/datasets_pontos_corridos/busca_dados_pontos_corridos.ipynb",
    r"liga_serie_A/datasets_liga_serie_A/busca_dados_liga_serie_A.ipynb",
    r"liga_serie_B/datasets_liga_serie_B/busca_dados_liga_serie_B.ipynb",
    r"liga_serie_C/datasets_liga_serie_C/busca_dados_liga_serie_C.ipynb",
    r"libertadores/datasets_liberta/1_busca_dados_liberta_fase_1.ipynb",
    # r"libertadores/datasets_liberta/2_busca_dados_liberta_fase_2.ipynb",
    # r"libertadores/datasets_liberta/3_busca_dados_liberta_fase_3.ipynb",
    # r"libertadores/datasets_liberta/4_busca_dados_liberta_fase_4.ipynb",
    # r"libertadores/datasets_liberta/5_busca_dados_liberta_fase_5.ipynb",
    # r"sulamericana/datasets_sula/1_busca_dados_sula_oitavas.ipynb",
    # r"sulamericana/datasets_sula/2_busca_dados_sula_quartas.ipynb",
    # r"sulamericana/datasets_sula/3_busca_dados_sula_semi.ipynb",
    # r"sulamericana/datasets_sula/4_busca_dados_sula_final.ipynb",
    r"copa_leon/datasets_copa_leon/busca_dados_copa_leon.ipynb",
    # r"copa_aluna/datasets_copa_aluna/busca_dados_copa_aluna.ipynb",
]


def find_all_notebooks():
    return sorted([p.relative_to(ROOT) for p in ROOT.rglob("*.ipynb")])


def run_notebook(nb_path: Path, engine: str, kernel_name: str | None) -> None:
    nb_path = nb_path.resolve()
    workdir = nb_path.parent
    prev_cwd = os.getcwd()
    os.chdir(workdir)
    # Executa no lugar (sem criar outro arquivo) para manter o comportamento atual.
    try:
        if engine == "papermill":
            import papermill as pm  # type: ignore

            pm.execute_notebook(
                input_path=str(nb_path),
                output_path=str(nb_path),
                kernel_name=kernel_name,
                progress_bar=False,
            )
            return

        if engine == "nbclient":
            import nbformat  # type: ignore
            from nbclient import NotebookClient  # type: ignore

            nb = nbformat.read(nb_path, as_version=4)
            client = NotebookClient(nb, timeout=3600, kernel_name=kernel_name)
            client.execute()
            nbformat.write(nb, nb_path)
            return

        # Fallback via nbconvert
        cmd = [
            sys.executable,
            "-m",
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            "--inplace",
            str(nb_path),
        ]
        if kernel_name:
            cmd.extend(["--ExecutePreprocessor.kernel_name", kernel_name])
        subprocess.run(cmd, check=True, cwd=str(workdir))
    finally:
        os.chdir(prev_cwd)


def pick_engine():
    try:
        import papermill  # noqa: F401

        return "papermill"
    except Exception:
        pass

    try:
        import nbclient  # noqa: F401
        import nbformat  # noqa: F401

        return "nbclient"
    except Exception:
        return "nbconvert"


def main():
    parser = argparse.ArgumentParser(
        description="Executa notebooks em sequencia e para no primeiro erro."
    )
    parser.add_argument(
        "--engine",
        choices=["papermill", "nbclient", "nbconvert"],
        help="Forca o engine de execucao.",
    )
    parser.add_argument(
        "--kernel",
        help="Nome do kernel Jupyter a ser usado (ex: frangos_env).",
    )
    parser.add_argument(
        "--python",
        help="Executa este script usando outro Python (ex: \"py -3.11\" ou caminho completo).",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Mostra a lista que sera executada e sai.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Executa TODOS os .ipynb encontrados no repo.",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Filtra por termo(s) no caminho do notebook.",
    )
    parser.add_argument(
        "--keep-going",
        action="store_true",
        help="Nao interrompe no primeiro erro.",
    )
    args = parser.parse_args()

    if args.all:
        notebooks = find_all_notebooks()
    else:
        notebooks = [Path(p) for p in DEFAULT_NOTEBOOKS]

    if args.only:
        terms = [t.lower() for t in args.only]
        notebooks = [
            nb for nb in notebooks
            if any(t in str(nb).lower() for t in terms)
        ]

    if args.list:
        for nb in notebooks:
            print(nb)
        return 0

    if not notebooks:
        print("Nenhum notebook encontrado para executar.")
        return 1

    # Reexecuta com outro Python se solicitado (para usar o mesmo do VS Code).
    if args.python and os.environ.get("RUN_NOTEBOOKS_PY") != "1":
        raw = args.python.strip().strip('"').strip("'")
        if not raw:
            print("Parametro --python invalido.")
            return 1
        low = raw.lower()
        # No Windows, evita shlex (quebra barras). Aceita:
        # 1) "py -3.11" (launcher)
        # 2) caminho completo para python.exe
        if low.startswith("py ") or low.startswith("py.exe "):
            py_cmd = raw.split()
        else:
            py_cmd = [raw]
        # Recria argv sem o --python
        new_argv = [sys.argv[0]]
        skip = False
        for i, a in enumerate(sys.argv[1:]):
            if skip:
                skip = False
                continue
            if a == "--python":
                skip = True
                continue
            new_argv.append(a)
        env = os.environ.copy()
        env["RUN_NOTEBOOKS_PY"] = "1"
        cmd = py_cmd + new_argv
        print("Reexecutando com:", " ".join(cmd))
        return subprocess.run(cmd, env=env).returncode

    engine = args.engine or pick_engine()
    print(f"Engine: {engine}")
    if args.kernel:
        print(f"Kernel: {args.kernel}")

    if engine == "nbclient":
        try:
            import nbclient  # noqa: F401
            import nbformat  # noqa: F401
        except Exception as exc:
            print("nbclient/nbformat nao disponiveis:", exc)
            print("Instale com: pip install nbclient nbformat")
            return 1

    if engine == "papermill":
        try:
            import papermill  # noqa: F401
        except Exception as exc:
            print("papermill nao disponivel:", exc)
            print("Instale com: pip install papermill")
            return 1

    errors = []
    for i, nb in enumerate(notebooks, start=1):
        nb_path = (ROOT / nb).resolve()
        if not nb_path.exists():
            msg = f"[SKIP] {nb} (nao encontrado)"
            print(msg)
            errors.append(msg)
            if not args.keep_going:
                break
            continue

        print(f"[{i}/{len(notebooks)}] RUN  {nb}")
        start = time.time()
        try:
            run_notebook(nb_path, engine, args.kernel)
            elapsed = time.time() - start
            print(f"[{i}/{len(notebooks)}] OK   {nb} ({elapsed:.1f}s)")
        except Exception as exc:
            elapsed = time.time() - start
            msg = f"[{i}/{len(notebooks)}] FAIL {nb} ({elapsed:.1f}s): {exc}"
            print(msg)
            errors.append(msg)
            if not args.keep_going:
                break

    if errors:
        print("\nErros:")
        for e in errors:
            print(" - " + e)
        return 1

    print("\nTudo ok.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
