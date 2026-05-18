# Monografia — Rolê SC

Projeto LaTeX da monografia do TCC (Ciência da Computação, UNIVALI Itajaí).

## Estrutura

```
monografia/
├── main.tex              # arquivo raiz; faz \input dos capítulos
├── info.tex              # capa, ficha, resumo, abstract, listas, sumário
├── modelonegocio.tex     # Cap. 1 — Modelo de negócios
├── especificacao.tex     # Cap. 2 — Especificação do produto
├── desenvolvimento.tex   # Cap. 3 — Desenvolvimento parcial
├── resultados.tex        # Cap. 4 — Resultados parciais
├── analise.tex           # Cap. 5 — Análise crítica
├── referencias.bib       # bibliografia BibTeX
├── images/               # figuras (PDF/PNG/JPG) — adicionar conforme necessário
└── styles/               # template UNIVALI (NÃO editar)
    ├── abntex2.cls
    ├── abntex2-alf.bst
    ├── abntex2cite.sty
    └── ttc_univali.sty
```

## Como compilar

### Overleaf (recomendado)
1. Faça upload da pasta `monografia/` como projeto no Overleaf.
2. Defina `main.tex` como documento principal.
3. Compilador: **pdfLaTeX**.
4. Compile (Overleaf roda `pdflatex -> bibtex -> pdflatex -> pdflatex`).

### Local (Windows com MiKTeX/TeX Live)
```powershell
cd monografia
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

## Como escrever

1. **Não edite o `main.tex`** a menos que precise adicionar/remover um capítulo.
2. **Cada `.tex` filho começa direto com prosa ou `\section{}`** — o `\chapter{}` fica no `main.tex`.
3. **Use o Claude AI** com o prompt em `docs/PROMPT_CLAUDE_TCC.md` para gerar conteúdo seção por seção.
4. **Toda referência citada precisa estar em `referencias.bib`** — não invente, sempre validar a existência real (DOI/ISBN/URL).
5. **Imagens**: gere diagramas em draw.io / Mermaid / PlantUML, exporte como PDF e coloque em `images/`.

## Convenções LaTeX do template

- `\citeonline{key}` → "Sobrenome (ano)" no fluxo do texto
- `\cite{key}` → "(Sobrenome, ano)" no final da frase
- `\begin{quadro}` para listas qualitativas (RN, RF, configurações)
- `\begin{table}` para dados quantitativos
- `\begin{figure}` com `\fbox{\parbox{...}{\includegraphics{...}}}` padrão UNIVALI
- Todo elemento flutuante tem `\caption{}`, `\caption*{Fonte: Autor.}` e `\label{}`

Veja `monografia-referencia/` para exemplos reais validados pela coordenação.
