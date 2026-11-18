# Sistema Academia (nome provisório — nome e logo a definir)

## What This Is

App pessoal de acompanhamento de academia, instalado no celular Android do próprio usuário (PWA), para uma única pessoa: homem, 32 anos, 70 kg, iniciante absoluto que começa a treinar em dezembro/2026. Guia o treino full body (o que fazer, como fazer, quanto peso usar), registra cargas/séries/repetições e mostra a progressão, acompanha alimentação (proteína), corpo (peso, fotos, medidas) e sono/energia, com metas e recordes pessoais.

## Core Value

Na academia, abrir o app e saber exatamente **qual treino fazer hoje, como executar cada exercício e com quanto peso** — e registrar cada série em segundos, para que a progressão de carga aconteça de forma automática e visível.

Se todo o resto falhar, isso precisa funcionar: treino do dia + registro de séries + sugestão da próxima carga, offline.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Programa full body para iniciante em rotação (ex: A/B), sem dias fixos da semana — "próximo treino" avança quando um treino é concluído (semana do usuário é irregular)
- [ ] Biblioteca de exercícios com passo a passo em texto (execução, erros comuns, músculos) + link para vídeo no YouTube
- [ ] Registro rápido de série (carga, reps, opcional RPE/"quanto sobrou") durante o treino, com timer de descanso
- [ ] Ajuda para descobrir a carga inicial de cada exercício nas primeiras semanas (usuário não sabe por onde começar)
- [ ] Progressão automática de carga (ex: dupla progressão) com sugestão da carga da próxima sessão
- [ ] Histórico e gráficos de evolução por exercício; detecção de recorde pessoal (PR)
- [ ] Registro de alimentação com foco em proteína (meta ~120 g/dia a validar na pesquisa) — modo leve, sem obrigar contagem exata
- [ ] Registro de peso corporal com gráfico
- [ ] Fotos de progresso guardadas apenas no celular
- [ ] Medidas com fita (braço, peito, cintura, coxa)
- [ ] Nota diária de sono e energia (1–5)
- [ ] Metas: frequência semanal (com sequência), peso corporal, carga por exercício (só depois de existir base), recordes
- [ ] Lembrete matinal de treino (usuário treina de manhã)
- [ ] Backup: exportar/importar arquivo (.json) para salvar no Drive/WhatsApp
- [ ] Nome e logo/ícone do app (criados pelo Claude)
- [ ] Funciona 100% offline, instalável na tela inicial do Android

### Out of Scope

- Servidor/conta online/sincronização na nuvem — o usuário perde o acesso ao Claude em breve; serviço gratuito pausa ou quebra sem manutenção. Dados ficam no celular + backup manual.
- Multiusuário, personal trainer, social/feed — uso exclusivo de uma pessoa.
- App nativo publicado na Play Store — PWA instalável cobre o uso sem custo de conta de desenvolvedor.
- Contagem completa de macros/calorias estilo MyFitnessPal — usuário não quer neurose; foco em proteína (decisão final após pesquisa).
- GIFs/animações embutidas dos exercícios — deixa o app pesado; texto + link de vídeo resolvem.
- Integração com smartwatch / Google Fit — complexidade sem retorno para v1.

## Context

- Usuário é iniciante absoluto: nunca foi à academia, não sabe cargas, séries nem execução. O app precisa ser o "personal" dele.
- Objetivo: ganhar massa muscular, ficar mais forte e disposto, com foco também em estética.
- Ouviu que full body é o que dá mais resultado para iniciante — validar com pesquisa (frequência por grupo muscular, volume).
- Segue influenciadores da "dieta da selva" (comer até a saciedade, sem contar proteína). Tem dúvida se precisa bater 120 g de proteína. A pesquisa deve comparar com evidência científica (ex: ~1,6–2,2 g/kg para hipertrofia) e o app deve oferecer um caminho leve.
- Frequência semanal irregular; treino de manhã.
- A assinatura do Claude vai terminar: o app tem que rodar e ser mantido sem IA — código simples, sem dependências que exijam atualização, sem build complexo se possível.
- Usa celular Android.
- Idioma: português do Brasil.

## Constraints

- **Plataforma**: PWA para Android, instalável — sem custo, sem loja.
- **Dados**: 100% local no aparelho (IndexedDB/localStorage) + exportar/importar backup — sem servidor.
- **Hospedagem**: estática e gratuita (ex: GitHub Pages) ou arquivo local — precisa continuar no ar sem manutenção.
- **Manutenibilidade**: mínimo de dependências; deve funcionar por anos sem atualização.
- **Offline**: tudo do treino precisa funcionar sem internet (academia pode ter sinal ruim); só o vídeo do YouTube precisa de rede.
- **Prazo**: pronto para uso antes de começar a academia (dezembro/2026).
- **Usabilidade**: registrar uma série com uma mão, entre séries, em poucos toques.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA local-first, sem servidor | Assinatura do Claude acaba; nada pode depender de manutenção | — Pending |
| Backup por arquivo exportado | Simples, grátis, não quebra | — Pending |
| Rotação de treinos (A/B…) em vez de dias fixos | Semana irregular; faltar não "quebra" o plano | — Pending |
| Exercícios: texto + link YouTube (sem GIF) | Offline e leve | — Pending |
| Alimentação com foco em proteína em modo leve | Dúvida "dieta da selva" vs contagem; decidir com pesquisa | — Pending |
| Metas de carga só após fase de descoberta de carga | Usuário não sabe cargas iniciais | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-18 after initialization*
