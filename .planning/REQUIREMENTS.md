# Requirements: Sistema Academia

**Defined:** 2026-11-18
**Core Value:** Na academia, abrir o app e saber exatamente qual treino fazer hoje, como executar cada exercício e com quanto peso — e registrar cada série em segundos, com progressão de carga automática e visível, offline.

## v1 Requirements

Escopo da primeira versão (pronta antes de começar a academia em dezembro/2026).

### Fundação (FUND)

- [ ] **FUND-01**: Usuário instala o app na tela inicial do Android (PWA standalone) e ele abre sem internet
- [ ] **FUND-02**: Dados ficam salvos no celular (IndexedDB) com armazenamento persistente solicitado e status visível em Configurações
- [ ] **FUND-03**: App mostra a versão atual e só aplica atualização entre treinos (nunca no meio de um treino)
- [ ] **FUND-04**: Usuário digita pesos com vírgula ou ponto (ex: 72,5) e o app entende corretamente
- [ ] **FUND-05**: Na primeira abertura, o usuário vê aviso de check-up médico / "não é aconselhamento médico" e informa peso e altura

### Programa e Exercícios (PROG)

- [ ] **PROG-01**: App vem com programa full body A/B pronto — todo treino trabalha pernas, empurrar, puxar e core (A: Leg press 45°, Supino reto com halteres, Puxada frontal, Mesa flexora, Elevação lateral, Rosca direta, Panturrilha em pé, Prancha; B: Agachamento goblet, Desenvolvimento com halteres, Remada baixa, Stiff com halteres, Voador, Tríceps na polia, Abdominal)
- [ ] **PROG-02**: Tela "Hoje" mostra o próximo treino (A ou B) pela rotação, sem depender do dia da semana — faltar não "quebra" o plano
- [ ] **PROG-03**: Cada exercício tem nome de academia brasileira, passo a passo de execução em pt-BR, erros comuns, músculos trabalhados e ajuste do aparelho
- [ ] **PROG-04**: Cada exercício tem botão que abre busca do YouTube em português para ver a demonstração
- [ ] **PROG-05**: Cada exercício mostra séries × repetições alvo, descanso e esforço esperado ("quantas repetições devem sobrar") conforme a fase (calibração / adaptação / base)
- [ ] **PROG-06**: Aquecimento guiado: app sugere 5 min leves + séries de aquecimento no primeiro exercício, marcadas como aquecimento (não contam para recorde)

### Treino ao Vivo (TREINO)

- [x] **TREINO-01**: Usuário inicia o treino do dia com um toque
- [ ] **TREINO-02**: Usuário registra uma série em 1–2 toques, com carga e repetições pré-preenchidas pela sugestão e ajustáveis por botões +/−
- [ ] **TREINO-03**: Ao registrar, o app mostra o que foi feito na sessão anterior desse exercício (ex: "anterior: 20 kg × 10")
- [ ] **TREINO-04**: Usuário informa "quanto sobrou" (leve / no ponto / pesado) na última série
- [ ] **TREINO-05**: Timer de descanso inicia sozinho após cada série, vibra/toca ao terminar e continua correto se a tela apagar ou o app for trocado
- [ ] **TREINO-06**: Tela não apaga durante o treino (wake lock)
- [x] **TREINO-07**: Treino em andamento é salvo a cada série — se o app fechar, recarregar ou o usuário voltar do YouTube, ele retoma de onde parou
- [ ] **TREINO-08**: Usuário pode desfazer a última série registrada
- [ ] **TREINO-09**: Usuário finaliza o treino e vê um resumo (duração, séries, cargas, recordes)

### Progressão de Carga (CARGA)

- [ ] **CARGA-01**: Nas 2 primeiras sessões de cada exercício (calibração), o app guia a descoberta da carga inicial com séries de rampa e a pergunta "quantas repetições ainda sobravam?"
- [ ] **CARGA-02**: Depois da calibração, o app aplica dupla progressão: quando todas as séries chegam ao topo da faixa (ex: 3×12 numa faixa 8–12), sugere subir a carga no próximo treino
- [ ] **CARGA-03**: App mostra uma linha explicando a sugestão (ex: "Você fez 3×12 — suba para 22 kg")
- [ ] **CARGA-04**: Se o usuário falhar a faixa mínima em 2 sessões seguidas ou estagnar 3 sessões, o app reduz a carga automaticamente
- [ ] **CARGA-05**: Após 10+ dias sem treinar, o app sugere retomar com 90% da carga (80% após 28+ dias)
- [ ] **CARGA-06**: Usuário pode ajustar o incremento de cada exercício (ex: +1 pino, +2 kg, próximo halter) e sobrescrever a carga sugerida a qualquer momento

### Progresso (EVOL)

- [ ] **EVOL-01**: Usuário vê o histórico de cada exercício (datas, cargas, repetições)
- [ ] **EVOL-02**: Usuário vê gráfico da evolução de carga por exercício
- [ ] **EVOL-03**: App detecta e comemora recorde pessoal (PR), ignorando aquecimento e calibração
- [ ] **EVOL-04**: Usuário vê histórico de treinos realizados (lista por data)

### Corpo e Check-in (CORPO)

- [ ] **CORPO-01**: Check-in matinal em poucos segundos: peso, sono (1–5) e energia (1–5) — todos opcionais
- [ ] **CORPO-02**: Gráfico de peso corporal com média móvel de 7 dias
- [ ] **CORPO-03**: Usuário tira fotos de progresso (frente/lado/costas) que ficam só no celular, reduzidas para não ocupar muito espaço
- [ ] **CORPO-04**: Usuário compara duas fotos lado a lado (ex: dia 1 vs hoje)

### Alimentação (ALIM)

- [ ] **ALIM-01**: Meta diária de proteína calculada pelo peso (1,7 g/kg ≈ 120 g para 70 kg), editável
- [ ] **ALIM-02**: Usuário marca proteína por refeição com atalhos de porções brasileiras (ovo, frango, carne, feijão, leite, whey…) que somam gramas
- [ ] **ALIM-03**: Usuário vê o total do dia e a média semanal (dias ≥ 112 g), em cores neutras, sem contagem de calorias
- [ ] **ALIM-04**: Se o peso médio não subir em 2 semanas, o app sugere acrescentar 1 porção de carboidrato por dia

### Metas e Lembretes (META)

- [ ] **META-01**: Usuário define meta de treinos por semana (padrão: 3) e vê sequência de semanas cumpridas, com 1 semana de folga permitida sem zerar
- [ ] **META-02**: Usuário define meta de peso corporal e vê progresso com ritmo saudável sugerido (~0,25–0,4% do peso/semana)
- [ ] **META-03**: Usuário define metas de carga por exercício, liberadas só após a calibração, com barra de progresso
- [ ] **META-04**: App guia o usuário a criar alarme matinal recorrente no Relógio do Android (e/ou arquivo de calendário .ics)
- [ ] **META-05**: Tela Hoje mostra aviso "há N dias sem treinar" quando aplicável, sem linguagem de culpa

### Análise por IA (IA)

- [ ] **IA-01**: Usuário toca em "Gerar relatório para IA" e o app monta um texto com resumo do histórico (cargas por exercício, frequência, peso médio, sono/energia, proteína) + pergunta pronta, copiável para colar em qualquer IA gratuita (ChatGPT, Gemini, Claude)
- [ ] **IA-02**: Usuário cadastra a própria chave da API do Gemini (guardada só no celular) e pede análise dos dados dentro do app, vendo a resposta em pt-BR
- [ ] **IA-03**: Se a IA dentro do app falhar (sem internet, chave inválida, modelo descontinuado), o app mostra mensagem clara e oferece o relatório para colar como alternativa; o nome do modelo é configurável sem mexer no código

### Backup (BKP)

- [ ] **BKP-01**: Usuário exporta todos os dados (sem fotos) num arquivo de backup versionado e pode enviá-lo pelo compartilhamento do Android (Drive, WhatsApp) ou baixar
- [ ] **BKP-02**: Usuário importa um backup, vê prévia do que será restaurado e confirma
- [ ] **BKP-03**: App mostra "último backup há N dias" e lembra de fazer backup após vários treinos sem backup
- [ ] **BKP-04**: Usuário exporta as fotos de progresso separadamente

### Identidade e Manutenção (LANC)

- [ ] **LANC-01**: App tem nome e logo/ícone próprios na tela inicial do Android
- [ ] **LANC-02**: App fica hospedado gratuitamente (GitHub Pages) numa URL definitiva
- [ ] **LANC-03**: Existe um guia em pt-BR de como manter o app sem IA (publicar, adicionar exercício, restaurar backup)

## v2 Requirements

Adiado. Rastreado, fora do roadmap atual.

### Treino

- **TREINO-V2-01**: Trocar exercício na hora ("aparelho ocupado") por alternativa equivalente
- **TREINO-V2-02**: Versão curta do treino (4 exercícios principais) que conta como treino feito
- **TREINO-V2-03**: Sinal de dor/desconforto por exercício que bloqueia aumento de carga e sugere alternativa
- **TREINO-V2-04**: Calculadora de anilhas
- **TREINO-V2-05**: Troca de 2–3 acessórios após 8–12 semanas

### Corpo e Progresso

- **CORPO-V2-01**: Medidas com fita (braço, peito, cintura, coxa) a cada 4 semanas
- **EVOL-V2-01**: Gráficos de 1RM estimado e volume
- **EVOL-V2-02**: Correlação sono/energia × desempenho

### Outros

- **OUT-V2-01**: Deload programado (após ~6 meses)
- **OUT-V2-02**: Programa intermediário (após ~6–12 meses)
- **OUT-V2-03**: Exportar CSV

## Out of Scope

| Feature | Reason |
|---------|--------|
| Servidor / conta / sincronização na nuvem | Usuário reconsiderou e confirmou celular + backup: serviço gratuito pausa/quebra sem manutenção |
| Servidor próprio para IA | IA chamada direto do celular com chave do usuário, ou relatório copiado — sem backend |
| Notificação push agendada pelo app | Notification Triggers abandonado pelo Chrome; Web Push exige servidor — substituído por alarme do Relógio |
| Contagem completa de calorias/macros, código de barras, banco de alimentos | Usuário não quer neurose; proteína resolve o essencial |
| Treinos gerados por IA / aleatórios, construtor de programas | Iniciante precisa de programa fixo; troca de programa atrapalha o progresso |
| Biblioteca enorme de exercícios, GIFs | Peso e confusão; texto + YouTube resolvem |
| Social, feed, gamificação, sequência diária com culpa | Uso pessoal; streak diário conflita com semana irregular |
| Teste de 1RM | Arriscado para iniciante; calibração por repetições sobrando substitui |
| Smartwatch / Google Fit | Complexidade sem retorno na v1 |
| App nativo na Play Store | PWA cobre sem custo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FUND-01 | Phase 1 | Pending |
| FUND-02 | Phase 1 | Pending |
| FUND-03 | Phase 1 | Pending |
| FUND-04 | Phase 1 | Pending |
| FUND-05 | Phase 1 | Pending |
| PROG-01 | Phase 1 | Pending |
| PROG-02 | Phase 1 | Pending |
| PROG-03 | Phase 1 | Pending |
| PROG-04 | Phase 1 | Pending |
| PROG-05 | Phase 1 | Pending |
| PROG-06 | Phase 1 | Pending |
| TREINO-01 | Phase 1 | Complete |
| TREINO-02 | Phase 1 | Pending |
| TREINO-03 | Phase 1 | Pending |
| TREINO-04 | Phase 1 | Pending |
| TREINO-05 | Phase 1 | Pending |
| TREINO-06 | Phase 1 | Pending |
| TREINO-07 | Phase 1 | Complete |
| TREINO-08 | Phase 1 | Pending |
| TREINO-09 | Phase 1 | Pending |
| CARGA-01 | Phase 1 | Pending |
| CARGA-02 | Phase 1 | Pending |
| CARGA-03 | Phase 1 | Pending |
| CARGA-04 | Phase 1 | Pending |
| CARGA-05 | Phase 1 | Pending |
| CARGA-06 | Phase 1 | Pending |
| EVOL-01 | Phase 2 | Pending |
| EVOL-02 | Phase 2 | Pending |
| EVOL-03 | Phase 1 | Pending |
| EVOL-04 | Phase 2 | Pending |
| CORPO-01 | Phase 2 | Pending |
| CORPO-02 | Phase 2 | Pending |
| CORPO-03 | Phase 3 | Pending |
| CORPO-04 | Phase 3 | Pending |
| ALIM-01 | Phase 3 | Pending |
| ALIM-02 | Phase 3 | Pending |
| ALIM-03 | Phase 3 | Pending |
| ALIM-04 | Phase 3 | Pending |
| META-01 | Phase 3 | Pending |
| META-02 | Phase 3 | Pending |
| META-03 | Phase 3 | Pending |
| META-04 | Phase 3 | Pending |
| META-05 | Phase 3 | Pending |
| IA-01 | Phase 3 | Pending |
| IA-02 | Phase 3 | Pending |
| IA-03 | Phase 3 | Pending |
| BKP-01 | Phase 2 | Pending |
| BKP-02 | Phase 2 | Pending |
| BKP-03 | Phase 2 | Pending |
| BKP-04 | Phase 3 | Pending |
| LANC-01 | Phase 4 | Pending |
| LANC-02 | Phase 4 | Pending |
| LANC-03 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 53 total
- Mapped to phases: 53 (Phase 1: 27, Phase 2: 8, Phase 3: 15, Phase 4: 3)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-18*
*Last updated: 2026-11-18 after roadmap creation (4 phases, 5-day deadline)*
