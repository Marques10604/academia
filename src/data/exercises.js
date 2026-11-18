// Exercise library. For equipment 'halter', load means kg per dumbbell.
// For type 'time', reps means seconds and load stays 0.
// Each entry also carries pt-BR teaching content: muscles, setup (machine/bench adjustment),
// steps (how to do it), mistakes (common errors) and alternative (machine busy / missing). General fitness information, not medical advice.

const ex = (id, name, type, equipment, startLoadKg, incrementKg, noFailure, calibrate, youtubeQuery, content) =>
  Object.freeze({
    id, name, type, equipment, startLoadKg, incrementKg, noFailure, calibrate, youtubeQuery,
    muscles: Object.freeze({
      primary: Object.freeze(content.primary),
      secondary: Object.freeze(content.secondary),
    }),
    selectorized: content.selectorized === true, // pin-loaded machine/cable: may show "placa N" instead of kg
    setup: content.setup,
    alternative: content.alternative,
    steps: Object.freeze(content.steps),
    mistakes: Object.freeze(content.mistakes),
  });

const LIST = [
  ex('leg_press_45', 'Leg press 45°', 'reps', 'maquina', 20, 5, true, true, 'leg press 45 como fazer execução correta iniciante', {
    primary: ['quadríceps', 'glúteos'],
    secondary: ['posteriores de coxa', 'adutores'],
    alternative: 'Cadeira extensora, 3 × 10–15.',
    setup: 'Ajuste o encosto para ficar confortável e apoie os pés no meio da plataforma, na largura dos ombros. Solte as travas de segurança só quando a plataforma já estiver apoiada nos seus pés.',
    steps: [
      'Sente com a lombar e o quadril bem encostados no banco.',
      'Empurre a plataforma com o pé inteiro até quase esticar as pernas, sem travar os joelhos.',
      'Desça devagar até os joelhos formarem cerca de 90°, sem o quadril sair do banco.',
      'Mantenha os joelhos na direção dos pés durante todo o movimento.',
      'Ao terminar, volte as travas de segurança antes de levantar.',
    ],
    mistakes: [
      'Travar os joelhos no topo do movimento.',
      'Descer tanto que a lombar sai do banco.',
      'Deixar os joelhos caírem para dentro.',
    ],
  }),
  ex('db_bench_press', 'Supino reto com halteres', 'reps', 'halter', 6, 2, false, true, 'supino reto com halteres execução correta iniciante', {
    primary: ['peitoral', 'tríceps'],
    secondary: ['ombro (parte da frente)'],
    alternative: 'Supino reto na máquina (chest press) ou flexão de braço inclinada (mãos no banco).',
    setup: 'Use um banco reto e mantenha os pés firmes no chão. Antes de deitar, apoie os halteres nas coxas e depois deite levando um halter de cada vez ao peito.',
    steps: [
      'Deite com as costas apoiadas no banco e os halteres na linha do peito.',
      'Mantenha os cotovelos a cerca de 45° do corpo, sem abrir demais.',
      'Desça devagar até sentir o peito alongar.',
      'Suba os halteres empurrando para cima, sem bater um no outro.',
    ],
    mistakes: [
      'Abrir os cotovelos a 90° em relação ao corpo.',
      'Tirar o quadril do banco para ajudar a subir.',
      'Descer rápido demais, sem controlar o peso.',
    ],
  }),
  ex('lat_pulldown', 'Puxada frontal', 'reps', 'polia', 20, 5, false, true, 'puxada frontal polia execução correta iniciante', {
    selectorized: true,
    primary: ['dorsais (costas)'],
    secondary: ['bíceps', 'meio das costas'],
    alternative: 'Puxada com triângulo ou pegada neutra, ou barra assistida (máquina).',
    setup: 'Ajuste o apoio das coxas para travar as pernas embaixo dele. Segure a barra com uma pegada um pouco mais larga que a largura dos ombros.',
    steps: [
      'Incline o tronco levemente para trás e olhe para frente.',
      'Puxe a barra até o alto do peito, levando os cotovelos para baixo.',
      'Aperte as costas por um instante lá embaixo.',
      'Volte a barra devagar, controlando, até esticar os braços.',
    ],
    mistakes: [
      'Balançar o corpo para ajudar a puxar.',
      'Puxar a barra para trás da nuca.',
      'Subir os ombros até as orelhas durante a puxada.',
    ],
  }),
  ex('lying_leg_curl', 'Mesa flexora', 'reps', 'maquina', 10, 5, false, true, 'mesa flexora como fazer execução correta', {
    selectorized: true,
    primary: ['posteriores de coxa'],
    secondary: ['panturrilha'],
    alternative: 'Cadeira flexora (sentado).',
    setup: 'Alinhe a articulação do joelho com o eixo da máquina e deixe o rolo logo acima do calcanhar, na parte de trás da perna.',
    steps: [
      'Deite de barriga para baixo e segure as alças da máquina.',
      'Mantenha o quadril colado no banco durante todo o movimento.',
      'Dobre os joelhos trazendo o rolo em direção ao glúteo.',
      'Desça devagar até quase esticar as pernas.',
    ],
    mistakes: [
      'Tirar o quadril do banco para conseguir levantar o peso.',
      'Soltar o peso de uma vez na descida.',
    ],
  }),
  ex('db_lateral_raise', 'Elevação lateral', 'reps', 'halter', 2, 1, false, true, 'elevação lateral halteres execução correta', {
    primary: ['ombros (parte lateral)'],
    secondary: ['trapézio'],
    alternative: 'Elevação lateral na polia ou na máquina.',
    setup: 'Fique em pé com halteres leves ao lado do corpo e os cotovelos levemente dobrados. Comece com muito pouco peso: esse exercício é sensível.',
    steps: [
      'Suba os braços para os lados até a altura dos ombros.',
      'Pense em levar os cotovelos para fora, e não as mãos.',
      'Pare na linha dos ombros, sem passar dela.',
      'Desça devagar, controlando o peso.',
    ],
    mistakes: [
      'Usar o impulso do corpo para levantar o peso.',
      'Subir os braços acima da linha dos ombros.',
      'Encolher os ombros em direção às orelhas.',
    ],
  }),
  ex('db_biceps_curl', 'Rosca direta', 'reps', 'halter', 5, 1, false, true, 'rosca direta halteres execução correta', {
    primary: ['bíceps'],
    secondary: ['antebraço'],
    alternative: 'Rosca na polia baixa ou na máquina (scott).',
    setup: 'Fique em pé com os pés na largura do quadril, um halter em cada mão e as palmas viradas para frente.',
    steps: [
      'Mantenha os cotovelos colados ao corpo.',
      'Suba os halteres até sentir o bíceps contrair.',
      'Desça devagar até esticar quase todo o braço.',
    ],
    mistakes: [
      'Balançar o tronco para trás para ajudar a subir.',
      'Deixar os cotovelos irem para frente.',
      'Descer só pela metade do movimento.',
    ],
  }),
  ex('standing_calf_raise', 'Panturrilha em pé', 'reps', 'maquina', 20, 5, false, true, 'panturrilha em pé máquina execução correta', {
    selectorized: true,
    primary: ['panturrilhas'],
    secondary: ['sóleo (músculo profundo da panturrilha)'],
    alternative: 'Panturrilha no leg press.',
    setup: 'Ajuste as ombreiras para os joelhos ficarem quase retos e apoie só a ponta dos pés na borda da plataforma.',
    steps: [
      'Desça os calcanhares até alongar bem a panturrilha.',
      'Suba na ponta dos pés o máximo que conseguir.',
      'Segure 1 segundo no alto.',
      'Desça devagar, sem quicar embaixo.',
    ],
    mistakes: [
      'Fazer o movimento curto, sem alongar embaixo.',
      'Quicar na parte de baixo para ganhar impulso.',
      'Dobrar os joelhos para ajudar a subir.',
    ],
  }),
  ex('plank', 'Prancha', 'time', 'peso-corporal', 0, 5, false, false, 'prancha abdominal como fazer iniciante', {
    primary: ['abdômen (reto e transverso)'],
    secondary: ['lombar', 'ombros'],
    alternative: 'Prancha com joelhos apoiados ou inclinada (mãos no banco).',
    setup: 'Apoie os antebraços no colchonete com os cotovelos logo abaixo dos ombros. Se estiver difícil, faça a versão mais fácil com os joelhos apoiados no chão.',
    steps: [
      'Deixe o corpo em linha reta, da cabeça até os calcanhares.',
      'Contraia o abdômen e o glúteo.',
      'Olhe para o chão, com o pescoço relaxado.',
      'Respire normalmente enquanto segura o tempo.',
    ],
    mistakes: [
      'Deixar o quadril cair em direção ao chão.',
      'Levantar o quadril alto demais.',
      'Prender a respiração.',
    ],
  }),
  ex('goblet_squat', 'Agachamento goblet', 'reps', 'halter', 8, 2, true, true, 'agachamento goblet como fazer iniciante', {
    primary: ['quadríceps', 'glúteos'],
    secondary: ['adutores', 'abdômen (core)'],
    alternative: 'Leg press 45° ou agachamento no Smith / hack.',
    setup: 'Segure um halter em pé, junto ao peito, com as duas mãos. Deixe os pés um pouco mais largos que os ombros, com as pontas levemente viradas para fora.',
    steps: [
      'Sente entre os quadris, mantendo o peito aberto.',
      'Mantenha os calcanhares no chão o tempo todo.',
      'Desça até onde a coluna conseguir ficar reta, sem arredondar.',
      'Suba empurrando o chão com os pés.',
    ],
    mistakes: [
      'Tirar os calcanhares do chão.',
      'Deixar os joelhos caírem para dentro.',
      'Arredondar a coluna na parte de baixo.',
    ],
  }),
  ex('db_shoulder_press', 'Desenvolvimento com halteres', 'reps', 'halter', 5, 2, true, true, 'desenvolvimento com halteres sentado execução correta', {
    primary: ['ombros'],
    secondary: ['tríceps'],
    alternative: 'Desenvolvimento na máquina.',
    setup: 'Use um banco com encosto reto (90°) ou levemente inclinado. Comece com os halteres na altura das orelhas.',
    steps: [
      'Mantenha as costas apoiadas no encosto.',
      'Empurre os halteres para cima, sem travar os cotovelos no alto.',
      'Desça devagar até a altura das orelhas.',
    ],
    mistakes: [
      'Arquear demais a lombar para empurrar o peso.',
      'Descer pouco, fazendo meia repetição.',
      'Bater os halteres um no outro lá em cima.',
    ],
  }),
  ex('seated_cable_row', 'Remada baixa', 'reps', 'polia', 20, 5, false, true, 'remada baixa polia execução correta iniciante', {
    selectorized: true,
    primary: ['costas (dorsais e meio das costas)'],
    secondary: ['bíceps'],
    alternative: 'Remada na máquina com apoio no peito ou remada curvada apoiada no banco inclinado.',
    setup: 'Apoie os pés na plataforma com os joelhos levemente dobrados. Segure o triângulo com as duas mãos e mantenha o tronco ereto.',
    steps: [
      'Puxe o triângulo até a barriga, levando os cotovelos para trás.',
      'Junte as escápulas (as "asas" das costas) no final do movimento.',
      'Volte esticando os braços devagar, sem curvar a coluna.',
    ],
    mistakes: [
      'Balançar o tronco para trás para puxar o peso.',
      'Arredondar as costas na volta.',
      'Puxar só com os braços, sem usar as costas.',
    ],
  }),
  ex('db_romanian_deadlift', 'Stiff com halteres', 'reps', 'halter', 8, 2, true, true, 'stiff com halteres como fazer sem machucar a lombar', {
    primary: ['posteriores de coxa', 'glúteos'],
    secondary: ['lombar (estabilização)'],
    alternative: 'Elevação pélvica, mesa flexora ou extensão de quadril na máquina.',
    setup: 'Fique em pé com os halteres na frente das coxas e os joelhos levemente dobrados. Comece bem leve até aprender o movimento.',
    steps: [
      'Empurre o quadril para trás, deslizando os halteres pelas coxas.',
      'Mantenha a coluna reta, sem arredondar as costas.',
      'Desça até sentir a parte de trás da coxa alongar.',
      'Volte contraindo o glúteo e empurrando o quadril para frente.',
    ],
    mistakes: [
      'Arredondar a coluna durante a descida.',
      'Dobrar demais os joelhos, transformando em agachamento.',
      'Descer além do ponto em que sente o alongamento.',
    ],
  }),
  ex('pec_deck', 'Voador', 'reps', 'maquina', 15, 5, false, true, 'voador peck deck execução correta', {
    selectorized: true,
    primary: ['peitoral'],
    secondary: ['ombro (parte da frente)'],
    alternative: 'Crucifixo com halteres (leve).',
    setup: 'Ajuste o banco para que as alças fiquem na altura do peito e mantenha as costas apoiadas no encosto.',
    steps: [
      'Mantenha os cotovelos levemente dobrados.',
      'Feche os braços à frente do peito, apertando o peitoral.',
      'Abra devagar até sentir o peito alongar, sem forçar o ombro.',
    ],
    mistakes: [
      'Abrir demais os braços, o que estressa o ombro.',
      'Soltar o peso de uma vez na volta.',
      'Tirar as costas do encosto.',
    ],
  }),
  ex('cable_triceps_pushdown', 'Tríceps na polia', 'reps', 'polia', 10, 2.5, false, true, 'tríceps na polia corda execução correta', {
    selectorized: true,
    primary: ['tríceps'],
    secondary: [],
    alternative: 'Tríceps testa com halteres ou tríceps na máquina.',
    setup: 'Use a polia alta com a corda. Fique em pé de frente para a máquina, com o tronco levemente inclinado para frente.',
    steps: [
      'Mantenha os cotovelos colados ao corpo.',
      'Estique os braços para baixo, abrindo a corda no final.',
      'Volte devagar até os cotovelos formarem cerca de 90°.',
    ],
    mistakes: [
      'Deixar os cotovelos irem para frente durante o movimento.',
      'Usar o peso do corpo para empurrar a corda.',
      'Subir demais as mãos na volta.',
    ],
  }),
  ex('crunch', 'Abdominal', 'reps', 'peso-corporal', 0, 2.5, false, false, 'abdominal crunch execução correta sem forçar o pescoço', {
    primary: ['abdômen (reto abdominal)'],
    secondary: ['oblíquos'],
    alternative: 'Elevação de joelhos (sentado) ou dead bug.',
    setup: 'Deite no colchonete com os joelhos dobrados e os pés no chão. Cruze as mãos sobre o peito ou toque de leve as têmporas.',
    steps: [
      'Tire as escápulas do chão enrolando o tronco para cima.',
      'Solte o ar enquanto sobe.',
      'Desça devagar, sem relaxar completamente no chão.',
    ],
    mistakes: [
      'Puxar o pescoço com as mãos.',
      'Subir com impulso em vez de usar o abdômen.',
      'Prender a respiração.',
    ],
  }),
];

export const EXERCISES = Object.freeze(Object.fromEntries(LIST.map((e) => [e.id, e])));

// A YouTube SEARCH link (not a single video id): it cannot go dead like a deleted video.
export function youtubeUrl(exercise) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(exercise.youtubeQuery);
}
