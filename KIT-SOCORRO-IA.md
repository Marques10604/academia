# Kit de socorro com IA grátis — Progride

Use este kit quando algo quebrar ou quando você quiser mudar alguma coisa no app. Ele funciona com o **ChatGPT** ou o **Gemini** (as versões grátis servem).

**Regra de segurança:** cole na IA **somente arquivos de código** do repositório. **Nunca** cole o seu arquivo de backup, seu peso, seus check-ins, senhas ou tokens. O código do app não tem nenhum dado pessoal seu; os seus treinos ficam só no celular.

Endereços:

- App (permanente): https://marques10604.github.io/academia/
- Código: https://github.com/Marques10604/academia
- Passo a passo sem IA: `MANUAL.md`

Antes de aplicar qualquer correção, faça um backup (Config → Backup e restauração → Baixar arquivo).

---

## 1. Texto para colar na IA

Abra uma conversa nova no ChatGPT ou no Gemini. Copie **do início ao fim** o bloco abaixo (da primeira à última linha) e cole na conversa. Depois, na mesma mensagem, escreva o problema (veja a seção 2) e cole o arquivo que precisa mudar.

```text
Eu NÃO sei programar. Preciso da sua ajuda para consertar ou mudar um app que já está pronto. Responda sempre em português do Brasil, com palavras simples.

O QUE É O APP
Progride é um app pessoal de academia (treino full body, registro de cargas, progressão, check-in da manhã, backup). É um PWA para Android, tudo em português do Brasil, e funciona sem internet. Endereço do app: https://marques10604.github.io/academia/ . Código: https://github.com/Marques10604/academia . Eu só altero o código pelo site github.com (botão de editar arquivo), nunca por programa instalado.

TECNOLOGIA
HTML, CSS e JavaScript puro com módulos ES (import/export). Não existe etapa de build, não existe npm install, não existe framework e não existe CDN. Os arquivos do repositório são exatamente o que roda no celular. Os dados ficam no IndexedDB do celular (banco "academia"). Hospedagem: GitHub Pages (a partir da branch main, pasta raiz).

MAPA DOS ARQUIVOS
- index.html: página única do app
- manifest.webmanifest: identidade do app instalado (NÃO mudar id, start_url nem scope)
- sw.js: service worker (funciona sem internet). Linha 1 = versão. Lista de arquivos entre // ASSETS-START e // ASSETS-END
- styles.css: todo o visual
- src/app.js: início do app e rotas (#/hoje, #/treino, #/config...)
- src/version.js: APP_VERSION, o número da versão
- src/ui/dom.js: função h() que monta a tela
- src/ui/today.js: tela Hoje (treino do dia)
- src/ui/workout.js: tela Treino (treino em andamento, registrar séries, descanso)
- src/ui/summary.js: tela Resumo (fim do treino, recordes)
- src/ui/exercise.js: tela Exercício (como fazer, carga, regulagem)
- src/ui/history.js: tela Histórico
- src/ui/body.js: tela Corpo (check-in, peso, cintura)
- src/ui/protein.js: tela Proteína (porções do dia e meta)
- src/ui/report.js: tela Relatório para IA
- src/ui/reminder.js: tela Lembrete matinal (alarme e arquivo de agenda)
- src/ui/backup.js: tela Backup (baixar, enviar, restaurar)
- src/ui/settings.js: tela Config
- src/ui/onboarding.js: primeira tela (boas-vindas)
- src/ui/firstday.js: tela Checklist do 1º dia
- src/ui/tabs.js: barra de abas de baixo
- src/ui/chart.js: gráficos em SVG
- src/ui/reasons.js e src/ui/datefmt.js: textos e datas das telas
- src/domain/progression.js e src/domain/plan.js: regra da próxima carga (dupla progressão)
- src/domain/records.js: recordes pessoais
- src/domain/timer.js: cronômetro de descanso
- src/domain/week.js: semana de treinos, meta semanal e sequência
- src/domain/body.js: peso médio e medidas
- src/domain/protein.js: meta e porções de proteína
- src/domain/goals.js: meta de peso, ritmo, sugestão de carboidrato e fotos a cada 4 semanas
- src/domain/report.js: texto do relatório para IA
- src/domain/reminder.js: arquivo .ics do lembrete
- src/domain/backup.js: formato do arquivo de backup (BACKUP_APP, BACKUP_STORES)
- src/domain/numbers.js: parseDecimal (aceita vírgula)
- src/domain/dates.js: datas locais
- src/domain/units.js, src/domain/draft.js, src/domain/history.js, src/domain/progress.js, src/domain/profile.js: regras de apoio
- src/data/db.js: banco IndexedDB (DB_NAME, SCHEMA_VERSION, onupgradeneeded)
- src/data/exercises.js: biblioteca de exercícios (função ex(...))
- src/data/program.js: Treino A e Treino B (função item(...))
- src/data/prefs.js e src/data/daily.js: preferências por exercício e check-in diário
- src/actions/workout.js: ações do treino (iniciar, registrar série, finalizar)
- src/platform/device.js: tela ligada, vibração e bipe
- tools/stamp-sw.mjs: copia a versão para sw.js e refaz a lista de arquivos
- tools/smoke.mjs: testes no navegador (precisa de Chrome)
- tools/make-icons.mjs: gera os ícones
- test/: testes automáticos das regras (node --test)

REGRAS QUE VOCÊ DEVE RESPEITAR
1. As telas só montam a página com a função h() de src/ui/dom.js. NUNCA use innerHTML: o texto digitado pelo usuário tem de continuar sendo só texto.
2. Os arquivos de src/domain nunca mexem no DOM, no IndexedDB nem no relógio. São só regras puras.
3. O banco IndexedDB chama "academia" e o número SCHEMA_VERSION fica em src/data/db.js. Para criar uma tabela (store) nova: aumente SCHEMA_VERSION e, em onupgradeneeded, só CRIE o que não existe. Nunca apague nem renomeie tabelas ou dados. Toda tabela nova também entra em BACKUP_STORES em src/domain/backup.js, senão fica fora do backup.
4. Nunca renomeie o id de um exercício (os treinos salvos usam esse id), nem DB_NAME, nem BACKUP_APP, nem id/start_url/scope do manifest.webmanifest.
5. Números digitados passam por parseDecimal (aceita vírgula, como 72,5).
6. Todos os textos do app ficam em português do Brasil.
7. Toda mudança publicada aumenta APP_VERSION em src/version.js e a linha 1 de sw.js para o MESMO número, e arquivo novo ou apagado entra ou sai da lista ASSETS de sw.js. (O comando node tools/stamp-sw.mjs faz as duas coisas.)
8. Testes: node --test (regras), node tools/smoke.mjs (telas, precisa de Chrome) e node tools/stamp-sw.mjs --check (confere sw.js).

COMO VOCÊ DEVE RESPONDER
- Responda com o ARQUIVO INTEIRO corrigido (não só o pedaço), um arquivo por vez, escrevendo antes o caminho exato dele.
- Mude o mínimo possível. Não "melhore" o que não pedi.
- Se precisar de outro arquivo para ter certeza, me peça o nome e eu colo.
- Explique em português simples o que mudou e por quê.
- No fim, me lembre de aumentar a versão (src/version.js e, por último, a linha 1 de sw.js).

Agora vou descrever o problema e colar o arquivo.
```

---

## 2. Como descrever o problema

Logo depois do texto da seção 1, na mesma mensagem, preencha:

```text
O que eu fiz:
O que eu esperava:
O que aconteceu:
Em qual tela:
Versão do app (Config → Sobre):
Mensagem de erro ou descrição da foto da tela:
```

Descreva **um problema por conversa**. Se a correção não funcionar, continue na **mesma conversa** e cole a nova mensagem de erro.

### Qual arquivo colar

| Tela ou assunto | Arquivo |
|---|---|
| Hoje | `src/ui/today.js` |
| Treino (em andamento) | `src/ui/workout.js` |
| Resumo | `src/ui/summary.js` |
| Exercício | `src/ui/exercise.js` |
| Histórico | `src/ui/history.js` |
| Corpo | `src/ui/body.js` |
| Backup | `src/ui/backup.js` |
| Proteína | `src/ui/protein.js` |
| Relatório para IA | `src/ui/report.js` e `src/domain/report.js` |
| Lembrete matinal | `src/ui/reminder.js` |
| Metas, sequência e fotos | `src/domain/week.js` e `src/domain/goals.js` |
| Config | `src/ui/settings.js` |
| Checklist do 1º dia | `src/ui/firstday.js` |
| Carga sugerida errada | `src/domain/progression.js` e `src/domain/plan.js` |
| Texto de um exercício | `src/data/exercises.js` |
| Exercícios do Treino A ou B | `src/data/program.js` |

Não sabe qual é? Descreva o problema e peça: "qual arquivo você precisa que eu cole?".

### Como copiar um arquivo

1. Abra https://github.com/Marques10604/academia e clique nas pastas até o arquivo (por exemplo `src`, depois `ui`, depois `today.js`).
2. Acima do código, clique no botão **Copy raw file** (ícone de dois quadradinhos): ele copia o arquivo inteiro.
3. Volte à conversa com a IA e cole (Ctrl+V) logo depois do seu texto.

---

## 3. Como aplicar a correção e publicar

Resumo (os cliques detalhados estão em `MANUAL.md`, seções "Publicar uma mudança" e "Desfazer uma mudança que quebrou o app"):

1. Faça um **backup** no celular (Config → Backup e restauração → Baixar arquivo).
2. No github.com, abra o arquivo que a IA corrigiu e clique no lápis **Edit this file**.
3. Clique dentro do código, aperte **Ctrl+A** (seleciona tudo) e **Ctrl+V** (cola o arquivo inteiro que a IA deu).
4. Clique no botão verde **Commit changes...**, deixe marcado **Commit directly to the main branch** e confirme.
5. Aumente a versão: edite `src/version.js` (por exemplo de 0.4.0 para 0.4.1) e salve. **Por último**, edite a linha 1 de `sw.js` para o mesmo número e salve. O `sw.js` vai sempre por último.
6. Abra a aba **Actions** e espere **pages build and deployment** ficar com o visto verde (1 a 3 minutos).
7. No celular, com internet, abra o Progride, feche por completo (botão de apps recentes, deslize o app para o lado) e abra de novo. Repita mais uma vez. Em Config, a versão nova aparece.

Se piorou, desfaça: `MANUAL.md`, seção "Desfazer uma mudança que quebrou o app".

---

## 4. (Opcional) Rodar os testes no computador

Só se você quiser conferir a correção antes de publicar. Não é obrigatório: publicar continua sendo pelo github.com.

1. Instale o **Node.js** (versão LTS) em https://nodejs.org : botão grande "LTS", abra o instalador e clique em Next até o fim.
2. No github.com, botão verde **Code** → **Download ZIP**. Extraia o ZIP (botão direito → Extrair tudo).
3. Abra a pasta extraída. Clique na barra de endereço do Explorador, digite `cmd` e aperte Enter.
4. Rode, um de cada vez:
   - `node --test` (regras do app)
   - `node tools/smoke.mjs` (telas; precisa do Google Chrome instalado)
   - `node tools/stamp-sw.mjs --check` (confere se `sw.js` está em dia)
5. Como ler: no `node --test`, procure a linha `fail 0`; no `smoke`, a última linha `smoke: N passed, 0 failed`. Qualquer "fail" ou "FAIL" maior que zero significa que algo está errado: cole a mensagem na IA.

Observação: se a IA mudar os treinos (`src/data/program.js`), o teste `test/catalog.test.js` falha **de propósito** até as listas esperadas serem atualizadas. Peça isso à IA e cole o arquivo `test/catalog.test.js`.
