# Project Research Summary

**Project:** Sistema Academia (nome provisório)
**Domain:** App pessoal de treino de academia — PWA offline-first, Android, pt-BR, usuário único, iniciante absoluto
**Researched:** 2026-11-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

Este é um "personal embutido num logger" de treino para uma única pessoa (homem, 32 anos, 70 kg, iniciante absoluto, começa em dezembro/2026). O mercado se divide entre loggers rápidos que assumem que o usuário já sabe o que fazer (Strong, Hevy, FitNotes) e coaches algorítmicos pagos e opacos (Fitbod, Alpha Progression). O formato que funciona para iniciante é o do StrongLifts — programa fixo A/B, progressão automática explicável — mas nenhum app combina isso com conteúdo de execução em pt-BR, descoberta guiada de carga inicial e rastreio leve de proteína/corpo. Essa combinação é o diferencial.

A abordagem recomendada é: (1) **stack sem build** — ES modules nativos, Preact + htm vendorizados (~17 KB), IndexedDB via `idb` atrás de um `db.js` próprio, CSS e gráficos SVG escritos à mão, service worker escrito à mão, hospedado no GitHub Pages por "deploy from a branch", sem CI. Razão: o app publicado não apodrece, mas a cadeia de ferramentas sim, e o dono perderá acesso ao Claude. (2) **Histórico como fonte única da verdade** — próximo treino, carga sugerida, PRs e sequências são funções puras sobre o histórico; só intenção do usuário e fatos são persistidos; treino em andamento é rascunho write-through com finalização atômica. (3) **Programa travado em full body** — toda sessão é full body; A/B só varia a seleção de exercícios; progressão padrão é **dupla progressão** (ex.: 3×8–12; todas as séries no topo → sobe a carga), apoiada por frequência ≥2×/semana por músculo, volume que escala com a presença e faixa de repetições que se autocorrige quando a carga inicial está errada.

Riscos principais: **perda de dados** (tudo só no celular → `storage.persist()`, backup `.json` versionado, nudge por gatilho, drill de restauração testado); **lembrete matinal** (Notification Triggers está morto; Web Push exige servidor → reescrever como **alarme do Relógio do Android / `.ics` recorrente guiado pelo app + nudge dentro do app**); **abandono nas semanas 4–8** e **registro lento** (sessões curtas, série em 1 toque pré-preenchida, metas semanais tolerantes, nada de culpa); **origem/URL permanente** (IndexedDB pertence à origem — URL final do GitHub Pages antes da primeira instalação).

Sobre a "dieta da selva": **adotar a parte compatível (comida de verdade, proteína em toda refeição) e rejeitar o resto**. O CFN não encontrou evidência; comer só até a saciedade pode ficar na manutenção ou abaixo para um homem magro de 70 kg; excluir arroz/feijão/fruta/tubérculos tira calorias e proteína baratas. Meta de **120 g/dia (1,7 g/kg) é razoável** — piso 112 g, esticada 140 g, sem benefício acima de ~154 g — com caminho leve (checklist de porções de proteína, sem contar calorias) e ajuste pelo peso médio semanal.

## Key Findings

### Recommended Stack

Detalhes em `STACK.md`. Nenhuma etapa de build: o repositório é o site publicado.

**Core technologies:**
- **ES modules nativos + import map** (Chrome 89+) — sem bundler; publicado = fonte.
- **Preact 11.2.0 + htm 3.1.1 vendorizados em `/vendor`** — UI declarativa com hooks; evita perda de foco no tick do timer e XSS. Preact singleton via import map. Plano B: vanilla com helper `h()`.
- **idb 8.0.4 atrás de `db.js`** — migrações por `oldVersion`. Dexie é pesado demais.
- **IndexedDB (inclusive Blobs de foto) + `navigator.storage.persist()`** — `localStorage` nunca guarda dados do usuário.
- **Service worker à mão (~60 linhas) + `tools/stamp-sw.mjs`** — precache atômico versionado, cache-first. Sem Workbox.
- **Web App Manifest** — `id` estável, ícones 192/512 + maskable, `display: standalone`, `lang: pt-BR`.
- **GitHub Pages (deploy from a branch) + `.nojekyll`** — grátis, sem CI, repo público (dados nunca no repo).
- **Gráficos SVG próprios (~150 LOC)** — fallback uPlot 1.6.32 vendorizado.
- **`node:test`** — testes das funções puras, sem dependências.

**Decisões de plataforma:**
- Roteamento por hash; caminhos relativos em todo lugar.
- Timer de descanso por `endsAt`; Wake Lock re-adquirido em `visibilitychange`; vibração/beep após gesto do usuário.
- Entrada numérica `inputmode="decimal"` normalizando vírgula (pt-BR digita `72,5`).
- Vídeo: URLs de busca do YouTube, não IDs.
- Backup: `<a download>` primário; `navigator.share({files})` secundário como `text/plain`; sem `showSaveFilePicker`; import por `<input type="file">` sem `accept` estrito.
- Lembrete: Notification Triggers MORTO; Periodic Background Sync só bônus; Web Push rejeitado.

### Expected Features

Detalhes em `FEATURES.md`.

**Must have (table stakes):**
- Tela "Treino de hoje" com rotação A/B sem dias da semana
- Biblioteca só dos exercícios do programa — passo a passo pt-BR, erros comuns, músculos, ajuste do aparelho, link YouTube
- Registro de série em 1–2 toques, pré-preenchido, steppers, "anterior: 20 kg × 10" inline, uma mão
- Persistência do treino em andamento (rascunho a cada série)
- Timer de descanso automático (timestamp, wake lock, vibração/som, só em primeiro plano)
- Calibração de carga inicial ("Estava leve / Perfeito / Pesado" → RIR 4+/3/≤1)
- Dupla progressão com regra de falha, override manual, incrementos por exercício, linha explicando a sugestão
- Histórico e gráfico por exercício; PR suprimido na calibração e em aquecimento
- Instalável/offline, `persist()`, backup/restauração `.json` versionado com "último backup há N dias"
- Check-in matinal: peso (média 7 dias), sono 1–5, energia 1–5

**Should have:**
- Proteína modo leve (checklist de porções, presets TACO, gramas opcionais), neutro, sem calorias
- Meta semanal de frequência com sequência semanal tolerante (token de folga)
- Lembrete matinal via `.ics` + guia do alarme do Relógio + nudge no app
- Fotos de progresso e medidas com fita (~4 semanas)
- Substituição de exercício, aquecimento sugerido, calculadora de anilhas, e1RM/volume, metas de carga pós-calibração
- Flag de dor/desconforto que bloqueia aumento automático

**Defer (v2+):** deload agendado (~6 meses), divisão intermediária, correlação sono/desempenho, CSV.

**Anti-features:** contagem completa de calorias/macros, treinos por IA, construtor de programas, biblioteca grande, GIFs, social, streak diário punitivo, autorregulação por prontidão, gamificação, notificações via servidor.

### Architecture Approach

Detalhes em `ARCHITECTURE.md`. ~30 arquivos pequenos sem build: UI → store/actions → domain (puro) + data (IO).

1. **`domain/` puro** — `progression.js`, `rotation.js`, `records.js`, `goals.js`, `nutrition.js`, `dates.js`, `migrate.js`, `rules.js`. Retorna `reasonCode` + params. Constantes em `rules.js` com o porquê científico; `node --test`.
2. **`data/`** (`db.js`, `repos.js`, `backup.js`, `seed/`) — únicos que conhecem stores; migrações append-only; transforms puros compartilhados entre `onupgradeneeded` e import; catálogo e programa em `seed/` com IDs imutáveis e `deprecated: true`.
3. **Stores** — `settings`, `programs`, `exercisePrefs`, `sessions` (séries embutidas), `active` (`"current"`), `bodyMetrics`, `dailyLogs`, `foodEntries`, `photos` (Blob + thumb), `goals`. Datas: `localDate "YYYY-MM-DD"` + timestamp ms.
4. **Store em memória fina + `actions/`** — fluxo unidirecional.
5. **`sw.js` + `router.js` (hash) + `ui/`** — sem `skipWaiting` por padrão (atualiza entre treinos). Navegação: Hoje | Histórico | Corpo | Comida | Mais.
6. **Padrões** — derivado-sobre-armazenado, rascunho write-through, migrações puras compartilhadas, módulos de capacidade com fallback, `docs/MAINTAINING.md` e `docs/DATA-FORMAT.md` como entregáveis.

### Programa e ciência de treino

Detalhes em `TRAINING-SCIENCE.md` (conteúdo de seed e constantes de `rules.js`).

- **Full body em toda sessão.** Não é provado "melhor", mas é não inferior e o mais robusto para semana irregular; 2 sessões/semana já dão 2×/músculo; 3–4 elevam o volume. Alternar por semana é pior que por sessão. Aviso suave (nunca bloqueio) para 2 sessões no mesmo dia ou >4/semana.
- **Sessão A (~55–60 min):** Leg press 45°, Supino reto com halteres, Puxada frontal, Mesa flexora, Elevação lateral, Rosca direta, Panturrilha em pé, Prancha.
- **Sessão B (~55–60 min):** Agachamento goblet, Desenvolvimento com halteres, Remada baixa na polia, Stiff com halteres, Voador, Tríceps na polia, Abdominal. Cada exercício com alternativa de máquina.
- **Duração:** manter o programa, oferecer "versão curta" (4 principais) que conta como treino; medir nas primeiras semanas.
- **Rotação:** próximo = oposto do último concluído (≥70% dos exercícios registrados); abandonado repete a letra.
- **Fases por sessões:** Calibração (1–2, 2 séries, RIR 3–4), Adaptação (3–6, RIR 3→2), Base (7+, última série RIR 1–2). Nunca falha em leg press, goblet, stiff ou desenvolvimento.
- **Ordem de aprendizado:** máquinas primeiro, depois goblet/stiff leves, depois core. Barra livre só após 12 semanas.
- **Faixas:** 8–12 (compostos livres), 10–15 (máquinas/pernas/rosca), 12–20 (elevação lateral/panturrilha), 20–45 s (prancha). Descanso 120/90/60 s.
- **Dupla progressão:** sobe quando todas as séries chegam ao rep_max com boa forma; BOOST (+2 incrementos, teto +10%) só nas primeiras 12 sessões do exercício e se RIR da última ≥3; se o menor salto >10% da carga, exigir rep_max+2; cair reps após subir é normal; reduzir um incremento se série < rep_min em 2 sessões seguidas; −10% após 3 sessões sem progresso.
- **Incrementos:** leg press +5 kg (+10 acima de 100), máquinas/cabos +1 pino, halteres próximo par, prancha +5 s. Configuráveis.
- **Calibração:** nunca 1RM; até 4 séries de rampa; "quantas repetições a mais você conseguiria?"; "na dúvida, escolha o maior" (Halperin 2022).
- **Pausas/deload:** sem deload agendado ~12 semanas; deload reativo só se ≥2 exercícios estagnam E (energia ≤2/5 ou sono <6 h em ≥3 de 7 dias). Retomada: ≥10 dias → 90%; ≥28 dias → 80% + calibração.
- **Troca:** mesmo A/B por 8–12 semanas, depois trocar no máximo 2–3 acessórios.

### Nutrição e recuperação

- **Proteína:** 120 g/dia (1,7 g/kg; `round(1.7 × kg / 5) × 5`), piso 112, esticada 140. Aderência = "dias com ≥112 g". 3 refeições de 30–40 g + 1–2 lanches de 10–20 g.
- **Caminho leve:** checklist por refeição (~30 g por palma), porções da mão, regra de superávit pelo peso médio ("sem subir em 2 semanas → +1 porção de carboidrato/dia"), lembrete suave ~19h. Sem alimentos proibidos.
- **Superávit:** 0,25–0,4% do peso/semana (~0,2–0,3 kg), guiado pela média semanal; ignorar 1–2 primeiras semanas.
- **Sono:** 7–9 h; <6 h → sugerir "+1 RIR hoje", nunca "pule".
- **Manhã:** horário não importa; aquecimento mais longo; lanche leve opcional; jejum aceitável; refeição proteica 1–2 h depois.
- **Medição:** pesagem diária ao acordar, média 7 dias; fita e fotos a cada 4 semanas; aviso de check-up médico obrigatório.

### Critical Pitfalls

Detalhes em `PITFALLS.md` (21 itens). Os 5 principais:

1. **Perda de dados** — `persist()`, nudge de backup por gatilho, import validado com prévia/snapshot, drill exportar→apagar→importar, `schemaVersion` desde o dia 1.
2. **Treino em andamento perdido** — write-through no `active`, retomada no boot, interceptar voltar, `overscroll-behavior-y: contain`, Wake Lock.
3. **Origem/URL e service worker** — URL final antes da instalação, namespacing (`sistema-academia-v1`, cache `sa-`), caminhos relativos, `.nojekyll`, caixa dos nomes de arquivo, precache atômico versionado, atualização só entre treinos, botão "forçar atualização" (nunca limpa IndexedDB), versão visível.
4. **Lembrete que não toca** — alarme do Relógio (guia ilustrado) + `.ics` com `RRULE`/`VALARM` + nudge; testar no celular real.
5. **Registro lento e abandono** — 1 toque, alvos ≥48 px, zona do polegar, sem modais, desfazer em vez de confirmar, vírgula decimal, vitórias cedo, semana de folga, linguagem neutra.

Também: bugs de data UTC (`localDate`), PRs falsos, dor ignorada (flag), fotos enormes (reduzir na captura), migração de schema (IDs imutáveis), dependências ocultas (zero CDN, `MAINTAINING.md`).

## Implications for Roadmap

Sugestão: **7 fases**, com o slice do Core Value na fase 3 e backup antes de qualquer dado real.

### Phase 1: Fundação (PWA, armazenamento, regras de dados)
**Rationale:** decisões irreversíveis depois que há dados (URL, nome do DB, IDs, versionamento, formato do backup).
**Delivers:** shell PWA instalável/offline, SW versionado + `stamp-sw.mjs`, roteador hash, `db.js` com migrações e `persist()`, `dates.js`, `version.js`, helper numérico pt-BR, envelope de backup com `schemaVersion`, repo/URL finais, nomes namespaced, ícone provisório.
**Research flag:** padrões padrão; exige disciplina de decisão.

### Phase 2: Domínio puro e conteúdo seed
**Rationale:** contratos de progressão/rotação fixam a forma dos dados; conteúdo está no caminho crítico.
**Delivers:** `rotation.js`, `progression.js`, `records.js`, `rules.js` + testes; catálogo A/B + pool de troca com textos pt-BR, alternativa de máquina, busca YouTube; programa como dado; cartão "Primeiro dia" e glossário.
**Research flag:** revisão das constantes [L] e do texto editorial.

### Phase 3: Treino do dia e registro (Core Value)
**Delivers:** tela Hoje, treino ao vivo (1 toque, steppers, anterior inline, quanto sobrou, desfazer, aquecimento), rascunho write-through + finalização atômica + retomada, timer `endsAt`, bottom sheet do exercício, resumo, flag de dor, troca de exercício, calibração.
**Research flag:** teste em aparelho real obrigatório.

### Phase 4: Backup e restauração
**Delivers:** export versionado, import validado com prévia/confirmação/snapshot, round-trip testado, nudge por gatilho, "último backup há N dias", share `text/plain` + fallback download, fotos fora do padrão, tela "Não limpe os dados".
**Research flag:** verificar share sheet no aparelho.

### Phase 5: Progresso e check-in corporal
**Delivers:** histórico por exercício, gráfico SVG (carga/e1RM), PRs, nota por exercício, check-in matinal (peso média 7 dias, sono, energia), gráfico de peso, vitórias cedo.

### Phase 6: Hábitos e corpo
**Delivers:** proteína modo leve, metas (frequência semanal tolerante, peso como faixa, carga pós-calibração), fotos (captura, redução, thumbnail, comparação), medidas com fita, lembrete reescrito (alarme + `.ics` + nudge), aviso de check-up.
**Research flag:** spike do lembrete e das fotos.

### Phase 7: Lançamento e passagem de bastão
**Delivers:** nome e logo finais, instalação real, teste em modo avião, atualização v1→v2 sem perda, fixture de backup, `MAINTAINING.md` e `DATA-FORMAT.md` em pt-BR, cópia do repo no Drive, Lighthouse, aviso médico.

### Phase Ordering Rationale

- Fundação e domínio antes da UI (contratos de dados).
- Treino antes de todo o resto (Core Value).
- Backup logo após o primeiro dado real.
- Hábitos/corpo por último entre features (maior risco de over-tracking e storage).
- Lançamento por último; nome/ícone fixos antes da primeira instalação real.
- Cada fase termina com teste em modo avião no aparelho.
- Calendário apertado: Fases 1–5 são o mínimo para o primeiro treino; 6–7 podem entrar nas primeiras semanas, mas identidade e backup não podem escorregar.

### Research Flags

Precisam de pesquisa de fase: Fase 2 (constantes e editorial), Fase 4 (share/import no aparelho), Fase 6 (lembrete e câmera).
Padrões padrão: Fases 1, 3 (com teste em aparelho), 5, 7.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versões npm verificadas; docs oficiais do Chrome. Share/backup no Android MEDIUM. |
| Features | MEDIUM | Docs de fornecedores HIGH; comparações e sentimento de usuários não verificados. |
| Architecture | MEDIUM-HIGH | Padrões consagrados; `persist()` e share-with-files MEDIUM. |
| Pitfalls | MEDIUM-HIGH | Técnicas bem documentadas; comportamento por marca LOW. |
| Training science | MEDIUM-HIGH | Frequência, volume, proteína, dupla progressão HIGH; regras numéricas de rampa/retomada/deload são convenção [L]. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Marca/modelo do celular (afeta `.ics`, bateria, share sheet).
- Equipamento real da academia (pinos, carrinho do leg press, halteres).
- Dupla vs linear nunca testada cabeça a cabeça em iniciantes — reavaliar após ~12 semanas.
- Duração da sessão — medir e ajustar.
- Constantes [L] centralizadas em `rules.js`.
- Divergência de falha/deload resolvida pela ciência (`FAILS_BEFORE_DELOAD` em `rules.js`).
- Aquecimento segundo a ciência; séries de aquecimento fora de PR/volume.
- Fotos fora do backup padrão; export de fotos separado.
- Citações (K) a verificar antes de qualquer tela "ciência".
- Dieta da selva: veredito é inferência; texto respeitoso no app.
- Segurança médica: avisos obrigatórios; onboarding pergunta altura.
- Unidades pino/placa não verificadas.
- Nome/logo e URL do GitHub Pages decididos antes da primeira instalação.

## Sources

### Primary (HIGH confidence)
- Registro npm (preact 11.2.0, htm 3.1.1, idb 8.0.4, dexie 4.4.7, uplot 1.6.32, vite 8.3.8), verificado em 2026-11-18
- Chrome for Developers: Notification Triggers, Periodic Background Sync, Wake Lock
- web.dev: persistent storage, install criteria, Web Share
- Docs do GitHub (Pages; workflows agendados desativados após 60 dias)
- StrongLifts support; Hevy help center
- Morton et al. 2018 (BJSM); ISSN position stand (Jäger 2017)
- Schoenfeld, Ogborn, Krieger 2016/2017; Schoenfeld, Grgic, Krieger 2019
- ACSM 2009 progression models
- Halperin et al. 2022; Singer et al. 2024

### Secondary (MEDIUM confidence)
- ACSM 2026 position stand (via resumos), Robinson 2024, Pelland 2024 (preprint)
- Coleman 2024, Bell 2023, Baz-Valle 2019, Damas 2016
- Iraki 2019, Slater 2019, Schoenfeld & Aragon 2018, Leidy 2015, Hall 2019
- Tabela TACO 4ª ed.; CFN sobre a "Dieta da Selva"
- Comparações de apps (Strong, Hevy, Fitbod, Boostcamp, Alpha Progression, FitNotes), Liftosaur
- File System Access no Android e tipos do Web Share

### Tertiary (LOW confidence)
- Google Calendar com `VALARM` na importação de `.ics`
- Recarga da PWA ao voltar da câmera do Android
- Convenções de praticante: rampa, retomada 90%/80%, deload reativo, ritmo de ganho, protocolos de medidas/fotos
- Unidades de pino das máquinas brasileiras

---
*Research completed: 2026-11-18*
*Ready for roadmap: yes*
