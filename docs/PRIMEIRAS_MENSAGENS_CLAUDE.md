# Mensagens-base para usar nas primeiras conversas do Claude

> **Pré-requisito:** o Project `TCC Rolê SC` já está criado no Claude com:
> - Project Knowledge com todos os documentos (`CONTEXTO_TCC_MONOGRAFIA.md`, `CONTRATO_*.md`, PDF do exemplo Thiago, `.tex` do `monografia-referencia/`).
> - System prompt (Project instructions) com o bloco interno de `PROMPT_CLAUDE_TCC.md`.
>
> Para cada conversa nova abaixo, **abra uma conversa nova** no Project (não continue a anterior), ative **Extended Thinking** e cole a mensagem.

---

## Conversa 1 — Validação do plano e calibragem (recomendada antes de gerar conteúdo)

> **Objetivo:** garantir que o Claude entendeu o projeto e o template antes de começar a escrever. Vai economizar retrabalho.

```text
Olá. Antes de começar a redigir, quero validar com você se entendeu o projeto e a estrutura do TCC. Por favor:

1. Confirme em 1 parágrafo o que é o Rolê SC, citando os 4 repositórios do ecossistema e o problema que ele resolve. (Base: CONTEXTO_TCC_MONOGRAFIA.md, seções 1 e 2.)

2. Confirme em 1 parágrafo o estado atual do projeto: o que está implementado, o que falta, e em qual etapa do TCC eu estou. (Base: seções 15 e 19 do contexto + esta conversa.)

3. Liste os 5 capítulos do meu TCC II conforme o template UNIVALI, indicando qual arquivo .tex corresponde a cada um e qual o conteúdo central de cada um (1 frase por capítulo).

4. Liste 3 dúvidas que você ainda tem sobre o projeto, sobre o estilo de escrita, ou sobre dados/medições que eu vou precisar te fornecer durante o trabalho.

Não escreva conteúdo da monografia ainda — só confirme entendimento e me faça as 3 perguntas.
```

**Após a resposta:** se algo estiver impreciso, corrija ali mesmo. Responda as 3 perguntas dele. Só passe para a próxima conversa quando estiver satisfeito.

---

## Conversa 2 — Gerar o `info.tex` (capa + Resumo + Abstract)

> **Objetivo:** entregar a primeira peça concreta. É curta (~250 palavras de Resumo + ~250 de Abstract) e te dá um termômetro rápido da qualidade da escrita.

```text
Vamos gerar o info.tex completo (capa, Resumo em pt-BR, Abstract em inglês, palavras-chave). O esqueleto já está em monografia/info.tex com TODO comentado.

Dados já confirmados:
- Nome: Gabriel Sodré da Silva Prates
- Curso: Ciência da Computação — UNIVALI Itajaí
- Orientador: Alex Luciano Roesler Rese, Me.
- Etapa: TCC II
- Data: novembro de 2026
- Título sugerido: "ROLÊ SC: APLICATIVO MOBILE AGREGADOR DE EVENTOS CULTURAIS E MUNICIPAIS DO LITORAL NORTE DE SANTA CATARINA COM EXTRAÇÃO AUTOMATIZADA VIA LLM"
- Área de concentração sugerida: "Engenharia de Software e Computação Móvel"

Pendências antes de você gerar:
1. O título oficial registrado na coordenação é esse mesmo, ou tenho que ajustar? (Se não tiver certeza, gere com o sugerido e marque [VALIDAR COM ORIENTADOR].)
2. A área de concentração faz sentido para um TCC mobile com pipeline serverless e NLP? Ou você sugere outra?

Para o Resumo (200-250 palavras), siga a estrutura:
- 1 frase de contexto/domínio
- 2-3 frases sobre o problema (fragmentação de fontes de eventos no litoral norte de SC)
- 2-3 frases sobre a solução proposta (pipeline crawler → NLP → API → app mobile)
- 2-3 frases sobre as tecnologias-chave (React Native, Fastify, AWS Lambda, MongoDB, LLM via Groq)
- 2-3 frases sobre resultados parciais já obtidos (Camboriú e Itajaí cobertos, 13 telas funcionais, autenticação social com Google)
- 1 frase sobre o que será feito no TCC III

5 palavras-chave em pt-BR e 5 keywords em inglês.

Entregue em LaTeX, pronto para colar dentro de monografia/info.tex (substituindo os blocos \begin{Resumo} e \begin{Abstract}). Não mexa no \begin{Info} (já está preenchido).
```

---

## Conversa 3 — Cap. 1, seção 1.1: "Introdução ao domínio de aplicação"

> **Objetivo:** primeira seção de prosa de verdade. Define o tom para o resto da monografia.

```text
Vamos escrever a primeira seção do Cap. 1 (Modelo de negócios), arquivo monografia/modelonegocio.tex. Seção: "Introdução ao domínio de aplicação".

Objetivo: contextualizar o leitor sobre o domínio (eventos culturais municipais no litoral norte de SC) e o problema (fragmentação das fontes de informação). Sem ainda apresentar a solução — isso vem na seção 1.3.

Tamanho-alvo: 5-8 parágrafos (~1 página).

Base de informação: seções 1 e 2 do CONTEXTO_TCC_MONOGRAFIA.md.

Estrutura sugerida (você pode reordenar):
1. Contextualização do litoral norte catarinense como polo cultural e turístico (1-2 parágrafos) — citar números reais se conseguir (turismo SC, eventos por ano, etc.) — me avise se precisar de dado externo que não está no contexto.
2. O fenômeno da fragmentação das fontes: cada prefeitura tem seu site, eventos privados ficam no Instagram, agregadores nacionais não cobrem o nicho (2 parágrafos).
3. Esforço do usuário/turista para descobrir eventos hoje (1-2 parágrafos com exemplo da persona Carolina, sem chamá-la pelo nome ainda — apenas descrever o cenário).
4. Encerramento apontando para a próxima seção (público alvo) — 1 parágrafo curto.

Estilo: terceira pessoa impessoal, voz ativa, frases diretas, sem floreio. Termos técnicos em \textit{}. Cite com \citeonline{} ou \cite{}.

Entregue:
- O conteúdo em LaTeX, pronto para substituir o bloco "% TODO: solicitar ao Claude" da seção \section{Introdução ao domínio de aplicação} em modelonegocio.tex.
- No final da mensagem (FORA do bloco LaTeX), liste todas as referências citadas com o nome da chave .bib que você usou e marque [VALIDAR] nas que você não tem 100% de certeza que existem.
```

---

## Conversa 4 — Seção 1.5: Levantamento de concorrentes

> **Objetivo:** uma das seções mais "ganha pontos" do TCC. É factual, demonstra pesquisa de mercado.

```text
Vamos para a seção "Levantamento de produtos existentes" do Cap. 1 (modelonegocio.tex).

Objetivo: apresentar a análise comparativa dos concorrentes do Rolê SC, no padrão do TCC do Thiago Zipper Melato (uma subseção por produto, com descrição, características, pontos positivos/negativos e preço/disponibilidade quando aplicável).

Base de informação: seção 5 do CONTEXTO_TCC_MONOGRAFIA.md.

Crie uma subseção \subsection{} para cada um:
1. Sympla
2. Eventbrite
3. Facebook Events
4. Instagram (descoberta orgânica)
5. Sites das prefeituras (ex.: Itajaí e Camboriú)
6. Apps municipais ("Visite Bombinhas", Camboriú Convention) — se você não tiver dado concreto sobre algum, me peça antes de escrever

Para cada subseção, siga a estrutura do Thiago:
- 1 parágrafo de descrição da plataforma e marca
- 1-2 parágrafos de características técnicas/funcionais
- 1 parágrafo discutindo pontos fortes/fracos no contexto específico do litoral norte SC
- Inclua uma figura (\begin{figure}) com placeholder para a captura/logo do produto (eu vou capturar depois e colocar em images/) — só me dê o nome sugerido do arquivo (ex: images/LogoSympla.png) e o caption.

Ao final, antes da próxima seção, escreva 1 parágrafo síntese conectando: "diante deste panorama, percebe-se que nenhuma solução existente atende [X, Y, Z], justificando o desenvolvimento do Rolê SC".

Liste no final da resposta as referências usadas com [VALIDAR] nas incertas.
```

---

## Conversa 5 — Seção 1.6: Objetivos

> **Objetivo:** seção curta mas crítica. Define o que o trabalho promete entregar.

```text
Vamos para a seção "Objetivos" do Cap. 1 (modelonegocio.tex), no padrão do Thiago Zipper Melato:

\subsection{Objetivos Gerais} — 1 frase única, direta, que sintetiza o trabalho.

\subsection{Objetivos Específicos} — lista \begin{enumerate} com 5-7 itens, cada um começando com verbo no infinitivo (Investigar, Aplicar, Desenvolver, Validar, Disponibilizar, etc.).

Base de informação: seções 1, 2 e 7 do CONTEXTO_TCC_MONOGRAFIA.md.

Para o Objetivo Geral, foque em: aplicativo mobile + agregação automatizada de eventos + pipeline de extração via LLM + litoral norte SC.

Para os Específicos, distribua entre:
- Investigação/pesquisa (concorrentes, modelos LLM aplicáveis)
- Modelagem (arquitetura, banco, casos de uso)
- Implementação (pipeline crawler+NLP, API REST, app mobile)
- Validação (testes em pista — adapte: testes reais em ambiente de produção, captura de eventos reais, validação manual da qualidade da extração)
- Disponibilização (publicação como APK de teste / preview; Play Store fica para TCC III)

Entregue em LaTeX, pronto para colar.
```

---

## Conversa 6 e seguintes — Cap. 2 (Especificação)

Para o Cap. 2 (especificacao.tex), recomendo dividir em **3 conversas separadas** porque é o capítulo mais longo:

### Conversa 6.1 — Tecnologias utilizadas

```text
Vamos para a seção \section{Tecnologias utilizadas} do Cap. 2 (especificacao.tex).

Vou pedir uma subseção \subsection{} por vez para você não exceder o tamanho da resposta. Comece pela primeira: React Native + Expo.

Base: seção 6 do CONTEXTO_TCC_MONOGRAFIA.md (especialmente 6.2).

Padrão para cada tecnologia (siga o padrão do Thiago em monografia-referencia/especificacao.tex linhas 6-53):
1. Parágrafo de descrição da tecnologia (com citação acadêmica/oficial).
2. Parágrafo de características-chave (com citação de fontes).
3. Parágrafo de relevância/popularidade no mercado (opcional, com referência tipo Stack Overflow Survey ou TIOBE).
4. Parágrafo do PAPEL ESPECÍFICO no projeto Rolê SC e justificativa da escolha.

Comece por React Native + Expo. Quando eu confirmar, passamos para a próxima (TypeScript, Fastify, AWS Lambda, MongoDB, JWT/OAuth, Playwright, Groq/Llama, S3/SES).
```

### Conversa 6.2 — Requisitos e Regras

```text
Vamos para o bloco \section{Documentação do sistema} do Cap. 2 (especificacao.tex). Gere as 3 primeiras subseções de uma vez (são tabelas, então é rápido):

\subsection{Regras de Negócio} — \begin{quadro} com as 25 RNs (seção 11 do contexto, RN01-RN25).

\subsection{Requisitos Funcionais} — \begin{table} com as 32 RFs (seção 9 do contexto, RF01-RF32). Pode dividir em 2 tabelas: (a) eventos+favoritos, (b) autenticação+perfil.

\subsection{Requisitos não funcionais} — \begin{table} com os 26 RNFs (seção 10 do contexto, RNF01-RNF26).

Use o padrão exato do Thiago em monografia-referencia/especificacao.tex linhas 60-209 (cabeçalho com \rowcolor[HTML]{EFEFEF}, \hline, \caption*{Fonte: Autor}, \label{qua:...} ou \label{tab:...}). Mantenha as colunas: ID/Descrição (e Prioridade para RFs e RNFs).
```

### Conversa 6.3 — Casos de uso

```text
Vamos para \subsection{Casos de Uso} do Cap. 2 (especificacao.tex).

Base: seção 12 do CONTEXTO_TCC_MONOGRAFIA.md.

Estrutura:
1. Texto introdutório curto (igual ao Thiago, linhas 213-224 do monografia-referencia/especificacao.tex).
2. Figura placeholder do diagrama UML de casos de uso para "Visitante" (não autenticado) — me dê o nome do arquivo sugerido (images/DiagramaCasosUsoVisitante.pdf) e o caption.
3. Quadros detalhados (uma \begin{table}[H] cada, no formato UC-VISITANTE-XX) para os 4 casos mais importantes do visitante: Listar eventos, Filtrar eventos, Ver detalhe do evento, Compartilhar evento.
4. Figura placeholder para "Usuário autenticado".
5. Quadros detalhados para os 5 casos mais importantes do usuário: Cadastrar-se, Verificar email, Fazer login (email/senha), Fazer login com Google, Recuperar senha, Upload de avatar.

Cada quadro UC-XXX-XX segue o padrão do Thiago (linhas 229-258 do referência): Pré-condições, Pós-condições, Atores, Fluxo Principal, Fluxo Alternativo, Fluxo de exceção.

Entregue tudo de uma vez.
```

---

## Conversa 7+ — Cap. 3, 4, 5

Sempre seguir o padrão "uma seção / subseção por conversa, com Extended Thinking ativo". O prompt-base do Project já cobre as convenções. Você não precisa mais repetir as regras.

Quando chegar nos capítulos 3, 4 e 5, abra uma conversa nova com algo no estilo:

```text
Vamos para a seção X.Y do capítulo Z (arquivo.tex). Base: seção W do contexto. Tamanho-alvo: N parágrafos / N páginas. Padrão: [padrão do exemplo no monografia-referencia, se houver]. [Restrições específicas, se houver]. Entregue em LaTeX.
```

---

## Dicas finais

1. **Quando o Claude entrega algo bom, salve direto no `.tex`**. Faça commit do .tex antes de pedir refinamento — assim você consegue reverter se uma iteração piorar.
2. **Quando o Claude entrega algo ruim, NÃO peça "refaça"**. Em vez disso, aponte o problema específico: "o segundo parágrafo está repetitivo com o primeiro" ou "a citação do Sommerville está descontextualizada". Feedback cirúrgico dá resultado melhor que pedido genérico.
3. **Não delegue revisão final ao Claude**. Toda saída precisa de leitura humana. Especialmente: nomes próprios, datas, números, referências.
4. **Toda referência citada deve ser validada no Google Scholar antes do commit final**. Se não achar, troca por outra ou marca `[CITAÇÃO PENDENTE]` no .tex pra resolver depois.
5. **Faça commit no Git a cada subseção finalizada** com mensagem do tipo `Cap. 1, Seção 1.1: introdução ao domínio (v1)`. Assim você tem snapshots e consegue ver evolução.
6. **Quando o capítulo inteiro ficar pronto, compile no Overleaf** e leia o PDF de cabo a rabo. O que parece bom em LaTeX bruto às vezes fica ruim renderizado.
