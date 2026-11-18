# Manual do Progride (sem programação)

Este manual é para quem **nunca programou**. Tudo é feito pelo site github.com, no computador (Windows), clicando. Não precisa instalar nada.

Os dois endereços:

- **O app** (permanente, nunca muda): https://marques10604.github.io/academia/
- **O código**: https://github.com/Marques10604/academia

## Regra de ouro

1. **Backup antes de qualquer mudança.**
2. **Uma mudança de cada vez.** Publique, confira, só depois faça a próxima.
3. **Nunca renomeie** a conta, o repositório nem o `id` do `manifest.webmanifest`. Veja "O que NÃO fazer".

Os nomes dos botões do GitHub ficam em inglês e em **negrito**. Ao lado vem o que significam e como é o ícone, caso o GitHub mude o lugar deles.

---

## Antes de qualquer mudança: faça um backup

Seus treinos ficam só no celular. Uma mudança errada no código não apaga isso, mas um backup deixa você tranquilo.

1. No celular, abra o Progride.
2. Toque em **Config** (aba de baixo).
3. Toque em **Backup e restauração**.
4. Toque em **Baixar arquivo** (ou em **Enviar (Drive, WhatsApp…)** para mandar para si mesmo).
5. Guarde o arquivo (nome `academia-backup-DATA`). Se mandou pelo WhatsApp ou Drive, ele fica salvo lá.

---

## Publicar uma mudança

"Publicar" é gravar a mudança no GitHub. O celular recebe a versão nova sozinho, na próxima vez que abrir o app com internet.

### Passo a passo (no computador)

1. Abra https://github.com/Marques10604/academia e entre na sua conta (botão **Sign in**, canto de cima).
2. Clique nas pastas até chegar ao arquivo que vai mudar. Exemplo: clique em `src`, depois em `data`, depois em `exercises.js`.
3. Clique no **lápis** (ícone de lápis, canto direito acima do código; ele se chama **Edit this file**, "Editar este arquivo").
4. Faça a mudança. Se uma IA deu o arquivo inteiro: clique dentro do código, aperte **Ctrl+A** (seleciona tudo) e **Ctrl+V** (cola no lugar).
5. Clique no botão verde **Commit changes...** (canto de cima, direita; "Gravar mudanças").
6. Na janelinha, deixe marcado **Commit directly to the main branch** ("gravar direto na branch principal") e clique no botão verde **Commit changes**.
7. **Suba a versão** (veja o próximo bloco). Sem isso o celular não recebe a mudança.
8. Clique na aba **Actions** (no topo do repositório). A linha **pages build and deployment** mostra uma bolinha amarela (trabalhando) e depois um **visto verde** (pronto). Demora de 1 a 3 minutos. Se ficar com um X vermelho, desfaça a mudança (seção "Desfazer").
9. Confira no navegador: abra https://marques10604.github.io/academia/src/version.js . Deve aparecer o número da versão nova.
10. No celular, com internet, abra o Progride e **feche por completo** (botão de apps recentes e deslize o app para o lado). Abra de novo. **Faça isso duas vezes.**
11. Toque em **Config**: em "Versão do app" deve aparecer o número novo.

Nunca mude de versão no meio de um treino.

### Como subir a versão

O número da versão está em dois lugares. Os dois precisam ficar iguais, e o `sw.js` **sempre por último**.

1. Abra `src/version.js`, clique no lápis **Edit this file**. A linha tem o número entre aspas, por exemplo `0.4.0`. Troque para o próximo (`0.4.1`). **Commit changes...** → **Commit changes**.
2. **Por último**, abra `sw.js` (fica na primeira tela do repositório), clique no lápis. Na **linha 1** troque o número para o mesmo (`const VERSION = '0.4.1';`). **Commit changes...** → **Commit changes**.

Por que o `sw.js` por último? O celular só percebe que existe versão nova quando o `sw.js` muda. Aí ele baixa todos os outros arquivos. Eles já precisam estar atualizados nesse momento.

### E se eu esquecer de subir a versão?

- **Não mudei o `sw.js`:** nada quebra, mas a mudança nunca chega ao celular. O celular continua com a versão antiga. Conserto: mude a linha 1 do `sw.js` para um número novo.
- **Mudei o `sw.js` antes dos outros arquivos:** o celular pode guardar uma mistura de arquivos velhos e novos. Conserto: suba a versão de novo, agora com o `sw.js` por último.
- **Criei um arquivo novo e não coloquei na lista do `sw.js`:** funciona com internet, mas **quebra no modo avião**. Conserto: veja "Criei um arquivo novo".
- **Apaguei ou renomeei um arquivo que continua na lista do `sw.js`:** a versão nova nunca instala e o celular fica na versão anterior. Conserto: tire essa linha da lista e suba a versão de novo.

### Criei um arquivo novo

1. No repositório, clique em **Add file** (botão no alto, "Adicionar arquivo") → **Create new file**. Digite o caminho completo no nome (por exemplo `pasta/arquivo-novo.js`) e cole o conteúdo.
2. **Commit changes...** → **Commit changes**.
3. Abra `sw.js` e clique no lápis. Procure a lista entre `// ASSETS-START` e `// ASSETS-END`.
4. Acrescente uma linha igual às outras, na ordem alfabética, com aspas e vírgula no fim: `'./pasta/arquivo-novo.js',`
5. **Commit changes...** → **Commit changes**. Depois suba a versão (`src/version.js`, e por último a linha 1 do `sw.js`).

### Com Node no computador (opcional)

Quem tem o Node instalado faz tudo isso de uma vez: `node tools/stamp-sw.mjs` atualiza a linha 1 e a lista do `sw.js` sozinho (depois de você mudar `src/version.js`), e `node tools/stamp-sw.mjs --check` confere. Como instalar o Node: `KIT-SOCORRO-IA.md`, seção 4.

---

## Desfazer uma mudança que quebrou o app

Seus treinos **não** se perdem: eles ficam no celular, não no código.

1. No repositório, abra o arquivo que você mudou.
2. Clique em **History** (ícone de relógio, no alto à direita do arquivo; "Histórico").
3. Procure a mudança **anterior** à que quebrou (a de baixo na lista) e clique no ícone `<>` ("ver o arquivo naquele ponto").
4. Clique em **Copy raw file** (ícone de dois quadradinhos; copia o arquivo inteiro).
5. Volte ao arquivo atual (abra-o de novo pelas pastas), clique no lápis **Edit this file**, aperte **Ctrl+A** e **Ctrl+V**.
6. **Commit changes...** → **Commit changes**.
7. Suba a versão de novo (`src/version.js`, e **por último** a linha 1 do `sw.js`) e espere a aba **Actions** ficar verde.
8. No celular, feche e abra o app duas vezes.

---

## Adicionar ou trocar um exercício

Os exercícios ficam em dois arquivos: `src/data/exercises.js` (a biblioteca, com as explicações) e `src/data/program.js` (quais exercícios entram no Treino A e no Treino B).

### 1. Criar o exercício em `src/data/exercises.js`

1. Abra o arquivo e clique no lápis.
2. Ache um exercício parecido com o novo. Copie o bloco inteiro dele, **de `ex(` até o `}),` que o fecha**.
3. Cole logo abaixo do último exercício, antes da linha `];`.
4. Troque cada campo, na ordem em que aparecem:
   - **id**: um nome novo, em minúsculas e com `_`. **Nunca repita nem renomeie** um id que já existe: os treinos salvos usam ele.
   - **nome**: como aparece no app.
   - **tipo**: `'reps'` (repetições) ou `'time'` (segundos, como a prancha).
   - **equipamento**: `'maquina'`, `'polia'`, `'halter'` ou `'peso-corporal'`.
   - **carga inicial** (em kg) e **incremento** (quanto sobe de cada vez).
   - **noFailure**: `true` se o exercício não deve ir até a falha.
   - **calibrate**: `true` se o app deve ajudar a descobrir a carga nos primeiros treinos.
   - **youtubeQuery**: o texto de busca do YouTube para o botão de vídeo.
   - Depois, entre as chaves: `primary` e `secondary` (músculos), `alternative` (o que fazer se não tiver a máquina), `setup` (como ajustar), `steps` (de 3 a 5 passos), `mistakes` (2 ou mais erros comuns) e `selectorized: true` só para máquinas de pino (com placa).
5. Mantenha as aspas, as vírgulas e os colchetes como no bloco copiado.

### 2. Colocar no treino em `src/data/program.js`

1. Abra o arquivo e clique no lápis.
2. Dentro do Treino A ou do Treino B, acrescente ou troque uma linha no formato `item('id', séries, repMin, repMax, descansoEmSegundos),` — por exemplo `item('crunch', 2, 12, 20, 60),`.
3. A ordem das linhas é a ordem no treino. O "Treino curto" usa só os 4 primeiros exercícios.
4. **Nunca apague um exercício que já tem histórico** em `src/data/exercises.js`. Para tirá-lo do treino, apague só a linha dele em `src/data/program.js`.

### 3. Publicar

Siga "Publicar uma mudança". Se você rodar os testes, o teste `test/catalog.test.js` falha **de propósito** depois de mudar o programa, até atualizarem as listas dele (peça isso à IA, com o `KIT-SOCORRO-IA.md`).

---

## Restaurar um backup

Use quando trocar de celular ou se os dados sumirem.

**Celular novo ou app vazio:**

1. No Chrome, abra https://marques10604.github.io/academia/ .
2. Menu **⋮** → **Instalar app** (ou **Adicionar à tela inicial**).
3. Abra o app pelo ícone novo.
4. Na primeira tela, toque em **Já tenho um backup — restaurar**.
5. Escolha o arquivo (em Downloads, ou o que você salvou do WhatsApp ou do Drive; o nome é `academia-backup-DATA`).
6. Confira o resumo de uma linha que aparece e toque em **Restaurar este backup**.

**App que já está em uso:**

1. Termine ou descarte um treino que esteja aberto.
2. **Config** → **Backup e restauração** → **Restaurar um backup**.
3. Escolha o arquivo, confira o resumo e toque em **Restaurar este backup**.

Atenção: restaurar **troca tudo** que está no celular pelo conteúdo do arquivo.

---

## O que NÃO fazer

- **Não renomeie** a conta `Marques10604` nem o repositório `academia`. O endereço do app muda e ele abre vazio no celular; só um backup traz os dados de volta.
- **Não deixe o repositório privado.** A hospedagem grátis só funciona com ele público.
- **Não mude** `id`, `start_url` nem `scope` em `manifest.webmanifest`.
- **Não mude** `DB_NAME` em `src/data/db.js` nem `BACKUP_APP` em `src/domain/backup.js`: os dados e os backups antigos deixariam de ser reconhecidos.
- **Não renomeie** o id de um exercício.
- **Não limpe os dados do Chrome** deste site e **não desinstale** o app sem um backup recente.
- **Não apague** o arquivo `.nojekyll`.
- **Não edite** o `sw.js` em nenhum lugar além da linha 1 e da lista de arquivos.
- **Não cole** seu arquivo de backup em uma IA.

Se o site sair do ar: no repositório, **Settings** (engrenagem, aba do alto) → **Pages**. Deve estar "Deploy from a branch", branch `main`, pasta `/ (root)`.

---

## Precisa de mais ajuda?

Use o `KIT-SOCORRO-IA.md`: ele ensina a pedir ajuda a uma IA grátis (ChatGPT ou Gemini). Ele também abre dentro do app: **Config** → **Precisa de ajuda?**.
