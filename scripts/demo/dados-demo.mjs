// DADOS FICTÍCIOS DA INSTÂNCIA MODELO. Nenhuma empresa, pessoa ou valor aqui é
// real: nomes, documentos, placas e números de contêiner são inventados (os
// contêineres têm dígito verificador válido para a tela não marcá-los como
// errados). As datas são relativas a "agora", então a tela Início sempre tem
// atrasados, compromissos de hoje e de amanhã.
//
// Não importa nada do app: é usado pelo carregador do emulador (firebase-admin)
// e pelo da nuvem (SDK do navegador), que gravam exatamente o mesmo conteúdo.

const pad = (n) => String(n).padStart(2, '0')

const relogio = (agora) => {
  const noDia = (dias, hora, min) => {
    const d = new Date(agora)
    d.setDate(d.getDate() + dias)
    d.setHours(hora, min, 0, 0)
    return d
  }
  return {
    // "2026-10-14T09:30", no horário local, como o campo de data e hora do app.
    local: (dias, hora = 9, min = 0) => {
      const d = noDia(dias, hora, min)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
    iso: (dias, hora = 9, min = 0) => noDia(dias, hora, min).toISOString(),
  }
}

// Dígito verificador ISO 6346 (mesma regra do app).
const valoresLetras = (() => {
  const mapa = {}
  let v = 10
  for (const letra of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    while (v % 11 === 0) v++
    mapa[letra] = v++
  }
  return mapa
})()

export const numeroContainer = (prefixo, serie) => {
  const base = prefixo + serie
  let soma = 0
  for (let i = 0; i < 10; i++) {
    const c = base[i]
    soma += (/[0-9]/.test(c) ? Number(c) : valoresLetras[c]) * 2 ** i
  }
  const dv = (soma % 11) % 10
  return `${prefixo} ${serie.slice(0, 3)}.${serie.slice(3, 6)}-${dv}`
}

export const CONFIG = {
  armadores: { lista: ['MSC', 'Maersk', 'CMA CGM', 'Hapag-Lloyd', 'ONE', 'Evergreen'] },
  terminals: {
    cheio: ['Terminal Portuário Alfa', 'Terminal Portuário Beta', 'Porto Seco Gama'],
    vazio: ['Depósito Vale do Sul', 'Depósito Baixada', 'Pátio Central de Contêineres'],
  },
  tipos: { lista: ["20'DC", "40'DC", "40'HC", "40'RF"] },
}

export const USUARIO_EMULADOR = { email: 'demo@logitrack.test', senha: 'demo-logitrack' }

// Checklist de importação. `base` = há quantos dias o carregamento foi
// concluído (negativo); as outras etapas concluídas vêm nos dias seguintes.
const checklistImport = (r, base, e = {}) => {
  const {
    agCarga = '', carregado = false, cte = false, ciot = false, mdfe = false,
    encerrado = false, entregue = false, agVazio = '', vazioFeito = false,
  } = e
  const marcar = (feito, dias, h, m) => (feito ? { v: 'true', em: r.iso(dias, h, m) } : { v: '', em: '' })
  const c = marcar(carregado, base, 10, 0)
  const t = marcar(cte, base, 15, 30)
  const i = marcar(ciot, base, 15, 40)
  const m = marcar(mdfe, base, 15, 50)
  const en = marcar(entregue, base + 1, 14, 20)
  const ec = marcar(encerrado, base + 1, 16, 10)
  const v = marcar(vazioFeito, base + 2, 11, 0)
  return {
    ag_carga: agCarga, ag_carga_check: c.v, ag_carga_check_em: c.em,
    gerar_cte: t.v, gerar_cte_em: t.em,
    gerar_ciot: i.v, gerar_ciot_em: i.em,
    gerar_mdfe: m.v, gerar_mdfe_em: m.em,
    encerrar_mdfe: ec.v, encerrar_mdfe_em: ec.em,
    carga_entregue: en.v, carga_entregue_em: en.em,
    ag_vazio: agVazio, ag_vazio_check: v.v, ag_vazio_check_em: v.em,
  }
}

const containerExport = (r, id, numero, e = {}) => ({
  id, numero, tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '',
  tara: '', lacre: '', deadlineDraft: '', deadlineCarga: '',
  agVazio: '', agVazioCheck: '', termVazioExp: '', estufagem: '', estufagemCheck: '',
  agCheio: '', agCheioCheck: '', termCheioExp: '',
  ...e,
})

export const gerarProcessos = (userId, agora = new Date()) => {
  const r = relogio(agora)
  const imp = (id, dados) => ({ id, userId, type: 'import', status: 'active', modalidade: 'conteiner', ...dados })
  const exp = (id, dados) => ({ id, userId, type: 'export', status: 'active', ...dados })

  return [
    // --- Importação -------------------------------------------------------
    imp('demo-imp-01', {
      createdAt: r.iso(-2, 9, 10),
      importador: 'Agro Vale Verde Ltda', armador: 'MSC', documentoTipo: 'DI', documentoNumero: '26/0041237-5',
      termCarga: 'Terminal Portuário Alfa', termVazio: 'Depósito Vale do Sul', finalizacaoVazio: 'devolucao',
      motorista: 'Carlos Mendes', placaCavalo: 'QRS4F56', placaCarreta: '', observacoes: 'Retirar com o lacre do armador conferido.',
      containers: [{ id: 'c_demo_01a', numero: numeroContainer('DEMU', '104827'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -1, { agCarga: r.local(0, 18, 0) }) }],
    }),
    imp('demo-imp-02', {
      createdAt: r.iso(-4, 15, 40),
      importador: 'Têxtil Horizonte S.A.', armador: 'CMA CGM', documentoTipo: 'DTA', documentoNumero: '26/0007781',
      termCarga: 'Terminal Portuário Beta', termVazio: 'Depósito Baixada', finalizacaoVazio: 'devolucao',
      motorista: '', placaCavalo: '', placaCarreta: '', observacoes: 'Dois contêineres, motoristas diferentes.',
      containers: [
        { id: 'c_demo_02a', numero: numeroContainer('LTRU', '230915'), tipo: "40'HC", motorista: 'Roberto Alves', placaCavalo: 'BRA2E19', placaCarreta: '',
          checklist: checklistImport(r, -2, { agCarga: r.local(-2, 10, 0), carregado: true, cte: true, ciot: true, mdfe: true, agVazio: r.local(1, 8, 0) }) },
        { id: 'c_demo_02b', numero: numeroContainer('LTRU', '230926'), tipo: "20'DC", motorista: 'Fábio Lima', placaCavalo: 'GHJ7K81', placaCarreta: '',
          checklist: checklistImport(r, -2, { agCarga: r.local(1, 9, 30) }) },
      ],
    }),
    imp('demo-imp-03', {
      createdAt: r.iso(-6, 11, 5),
      importador: 'Cerâmica Pedra Azul', armador: 'Hapag-Lloyd', documentoTipo: 'DUIMP', documentoNumero: '26BR00001234567',
      termCarga: 'Porto Seco Gama', termVazio: 'Pátio Central de Contêineres', finalizacaoVazio: 'devolucao',
      motorista: 'Marcos Teixeira', placaCavalo: 'PLM5C42', placaCarreta: '', observacoes: '',
      containers: [{ id: 'c_demo_03a', numero: numeroContainer('NAVU', '551340'), tipo: "40'DC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -1, { agCarga: r.local(-1, 16, 0) }) }],
    }),
    imp('demo-imp-04', {
      createdAt: r.iso(-5, 8, 30),
      importador: 'Indústria Metalúrgica Norte', armador: 'Maersk', documentoTipo: 'DI', documentoNumero: '26/0039102-0',
      termCarga: 'Terminal Portuário Alfa', termVazio: '', finalizacaoVazio: 'baixa',
      motorista: 'Anderson Rocha', placaCavalo: 'TUV9A07', placaCarreta: '', observacoes: 'Baixa de contêiner no cliente.',
      containers: [{ id: 'c_demo_04a', numero: numeroContainer('DEMU', '774215'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -2, { agCarga: r.local(-2, 7, 0), carregado: true, cte: true, ciot: true, mdfe: true }) }],
    }),
    imp('demo-imp-05', {
      createdAt: r.iso(-3, 14, 0), modalidade: 'solta', carga: '104 caixas de peças automotivas',
      importador: 'Comercial Sol Nascente', armador: 'ONE', documentoTipo: 'DTA', documentoNumero: '26/0008850',
      termCarga: 'Porto Seco Gama', termVazio: '', finalizacaoVazio: 'baixa',
      motorista: 'Wilson Prado', placaCavalo: 'XYZ3D58', placaCarreta: '', observacoes: 'Carga solta, entrega no galpão 2.',
      containers: [{ id: 'c_demo_05a', numero: '', tipo: '', motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -1, { agCarga: r.local(-1, 13, 0), carregado: true, cte: true }) }],
    }),
    imp('demo-imp-06', {
      createdAt: r.iso(-7, 10, 20),
      importador: 'Distribuidora Rio Claro', armador: 'ONE', documentoTipo: 'DI', documentoNumero: '26/0036644-9',
      termCarga: 'Terminal Portuário Beta', termVazio: 'Depósito Vale do Sul', finalizacaoVazio: 'devolucao',
      motorista: 'Eduardo Salles', placaCavalo: 'CDE6F90', placaCarreta: '', observacoes: 'Vazio sai para devolução hoje.',
      containers: [{ id: 'c_demo_06a', numero: numeroContainer('LTRU', '318604'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '',
        checklist: checklistImport(r, -3, { agCarga: r.local(-3, 9, 0), carregado: true, cte: true, ciot: true, mdfe: true, encerrado: true, agVazio: r.local(0, 18, 30) }) }],
    }),
    imp('demo-imp-07', {
      createdAt: r.iso(0, 8, 15),
      importador: 'Eletro Brasil Importações', armador: 'Evergreen', documentoTipo: 'DUIMP', documentoNumero: '26BR00002345678',
      termCarga: 'Terminal Portuário Alfa', termVazio: 'Depósito Baixada', finalizacaoVazio: 'devolucao',
      motorista: '', placaCavalo: '', placaCarreta: '', observacoes: 'Aguardando liberação para agendar.',
      containers: [{ id: 'c_demo_07a', numero: numeroContainer('NAVU', '602118'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, 0) }],
    }),
    imp('demo-imp-08', {
      createdAt: r.iso(-8, 9, 0),
      importador: 'Química Santa Helena', armador: 'MSC', documentoTipo: 'DI', documentoNumero: '26/0034518-2',
      termCarga: 'Terminal Portuário Beta', termVazio: '', finalizacaoVazio: 'baixa',
      motorista: 'Paulo Henrique', placaCavalo: 'KLM1N36', placaCarreta: '', observacoes: '',
      containers: [{ id: 'c_demo_08a', numero: numeroContainer('DEMU', '889052'), tipo: "20'DC", motorista: '', placaCavalo: '', placaCarreta: '',
        checklist: checklistImport(r, -4, { agCarga: r.local(-4, 10, 0), carregado: true, cte: true, ciot: true, mdfe: true, encerrado: true, entregue: true }) }],
    }),
    imp('demo-imp-09', {
      createdAt: r.iso(-3, 16, 45),
      importador: 'Móveis Serra Gaúcha', armador: 'Hapag-Lloyd', documentoTipo: 'DTA', documentoNumero: '26/0007912',
      termCarga: 'Porto Seco Gama', termVazio: 'Pátio Central de Contêineres', finalizacaoVazio: 'devolucao',
      motorista: 'Jair Nogueira', placaCavalo: 'OPQ8R14', placaCarreta: '', observacoes: 'Três contêineres da mesma DTA.',
      containers: [
        { id: 'c_demo_09a', numero: numeroContainer('LTRU', '412073'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -1, { agCarga: r.local(-1, 11, 0), carregado: true, cte: true, ciot: true, mdfe: true }) },
        { id: 'c_demo_09b', numero: numeroContainer('LTRU', '412084'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -1, { agCarga: r.local(0, 15, 30) }) },
        { id: 'c_demo_09c', numero: numeroContainer('LTRU', '412095'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: checklistImport(r, -1, { agCarga: r.local(2, 9, 0) }) },
      ],
    }),

    // --- Exportação -------------------------------------------------------
    exp('demo-exp-01', {
      createdAt: r.iso(-3, 10, 0),
      exportador: 'Café Planalto Exportadora', armador: 'Maersk', referencia: 'EXP-2026-118', booking: 'BKG-48215', navio: 'MV ATLANTIC STAR',
      motorista: 'Luciano Ferraz', placaCavalo: 'STU2G45', placaCarreta: '', observacoes: 'Draft vence amanhã cedo: conferir tara e lacre hoje.',
      containers: [containerExport(r, 'c_demo_e01a', numeroContainer('DEMU', '903417'), {
        agVazio: r.local(-1, 9, 0), agVazioCheck: 'true', agVazioCheckEm: r.iso(-1, 9, 40), termVazioExp: 'Depósito Vale do Sul',
        estufagem: r.local(1, 8, 0), agCheio: r.local(2, 6, 0), termCheioExp: 'Terminal Portuário Alfa',
        deadlineDraft: r.local(1, 9, 0), deadlineCarga: r.local(3, 12, 0),
      })],
    }),
    exp('demo-exp-02', {
      createdAt: r.iso(-6, 13, 30),
      exportador: 'Açúcar Costa Dourada', armador: 'CMA CGM', referencia: 'EXP-2026-097', booking: 'CMA-77302', navio: 'MV PACIFIC TRADER',
      motorista: 'Sérgio Barreto', placaCavalo: 'VWX7H20', placaCarreta: '', observacoes: 'Dois contêineres no mesmo booking.',
      containers: [
        containerExport(r, 'c_demo_e02a', numeroContainer('NAVU', '720861'), {
          agVazio: r.local(-3, 9, 0), agVazioCheck: 'true', agVazioCheckEm: r.iso(-3, 9, 30), termVazioExp: 'Depósito Baixada',
          estufagem: r.local(0, 16, 0), agCheio: r.local(1, 7, 0), termCheioExp: 'Terminal Portuário Beta',
          deadlineDraft: r.local(-2, 18, 0), deadlineCarga: r.local(2, 12, 0),
        }),
        containerExport(r, 'c_demo_e02b', numeroContainer('NAVU', '720872'), {
          agVazio: r.local(-3, 9, 30), agVazioCheck: 'true', agVazioCheckEm: r.iso(-3, 10, 10), termVazioExp: 'Depósito Baixada',
          estufagem: r.local(0, 17, 30), agCheio: r.local(1, 9, 0), termCheioExp: 'Terminal Portuário Beta',
          deadlineDraft: r.local(-2, 18, 0), deadlineCarga: r.local(2, 12, 0),
        }),
      ],
    }),
    exp('demo-exp-03', {
      createdAt: r.iso(-9, 9, 0),
      exportador: 'Frigorífico Pampa Verde', armador: 'Hapag-Lloyd', referencia: 'EXP-2026-081', booking: 'HLC-90177', navio: 'MV NORDIC WIND',
      motorista: 'Gilberto Costa', placaCavalo: 'AAB3C67', placaCarreta: '', observacoes: '',
      containers: [containerExport(r, 'c_demo_e03a', numeroContainer('DEMU', '615290'), {
        tipo: "40'RF", tara: '3750', lacre: 'LC-50321',
        agVazio: r.local(-6, 8, 0), agVazioCheck: 'true', agVazioCheckEm: r.iso(-6, 8, 30), termVazioExp: 'Depósito Vale do Sul',
        estufagem: r.local(-5, 14, 0), estufagemCheck: 'true', estufagemCheckEm: r.iso(-5, 16, 0),
        agCheio: r.local(-3, 7, 0), agCheioCheck: 'true', agCheioCheckEm: r.iso(-3, 8, 15), termCheioExp: 'Terminal Portuário Alfa',
        deadlineDraft: r.local(-4, 18, 0), deadlineCarga: r.local(-2, 12, 0),
      })],
    }),
  ]
}

// Processos que o app cria como "ativos" e que depois foram arquivados: a
// regra do Firestore só deixa nascer ativo, então os carregadores gravam
// primeiro como active e depois atualizam o status.
export const gerarArquivados = (userId, agora = new Date()) => {
  const r = relogio(agora)
  const concluido = (dias) => checklistImport(r, dias, {
    agCarga: r.local(dias, 10, 0), carregado: true, cte: true, ciot: true, mdfe: true, encerrado: true, agVazio: r.local(dias + 2, 11, 0), vazioFeito: true,
  })
  return [
    {
      id: 'demo-arq-01', userId, type: 'import', status: 'archived', modalidade: 'conteiner', createdAt: r.iso(-24, 9, 0),
      importador: 'Agro Vale Verde Ltda', armador: 'MSC', documentoTipo: 'DI', documentoNumero: '26/0029910-3',
      termCarga: 'Terminal Portuário Alfa', termVazio: 'Depósito Vale do Sul', finalizacaoVazio: 'devolucao',
      motorista: 'Carlos Mendes', placaCavalo: 'QRS4F56', placaCarreta: '', observacoes: '',
      containers: [{ id: 'c_demo_a01', numero: numeroContainer('DEMU', '288140'), tipo: "40'HC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: concluido(-20) }],
    },
    {
      id: 'demo-arq-02', userId, type: 'import', status: 'archived', modalidade: 'conteiner', createdAt: r.iso(-30, 9, 0),
      importador: 'Têxtil Horizonte S.A.', armador: 'Evergreen', documentoTipo: 'DUIMP', documentoNumero: '26BR00000987654',
      termCarga: 'Porto Seco Gama', termVazio: 'Pátio Central de Contêineres', finalizacaoVazio: 'devolucao',
      motorista: 'Roberto Alves', placaCavalo: 'BRA2E19', placaCarreta: '', observacoes: '',
      containers: [{ id: 'c_demo_a02', numero: numeroContainer('LTRU', '095531'), tipo: "40'DC", motorista: '', placaCavalo: '', placaCarreta: '', checklist: concluido(-26) }],
    },
    {
      id: 'demo-arq-03', userId, type: 'export', status: 'archived', createdAt: r.iso(-28, 9, 0),
      exportador: 'Café Planalto Exportadora', armador: 'Maersk', referencia: 'EXP-2026-060', booking: 'BKG-41007', navio: 'MV ATLANTIC STAR',
      motorista: 'Luciano Ferraz', placaCavalo: 'STU2G45', placaCarreta: '', observacoes: '',
      containers: [containerExport(r, 'c_demo_a03', numeroContainer('DEMU', '345072'), {
        tara: '3790', lacre: 'LC-48110',
        agVazio: r.local(-25, 8, 0), agVazioCheck: 'true', termVazioExp: 'Depósito Baixada',
        estufagem: r.local(-24, 14, 0), estufagemCheck: 'true',
        agCheio: r.local(-22, 7, 0), agCheioCheck: 'true', termCheioExp: 'Terminal Portuário Alfa',
        deadlineDraft: r.local(-23, 18, 0), deadlineCarga: r.local(-21, 12, 0),
      })],
    },
  ]
}

const CAMPOS = [
  ['frete_peso', 'Frete Peso'], ['pedagio', 'Pedágio'], ['ad_valorem', 'Ad-Valorem'], ['escolta', 'Escolta'],
  ['adc_margem', 'Adc. Margem'], ['ajudante', 'Ajudante'], ['adc_imo', 'Adc. IMO'], ['adc_ls', 'Adc. LS'],
  ['outros', 'Outros'], ['gris', 'Gris'],
]

const ficha = (cliente, valores, observacoes = '', extras = []) => ({
  cliente,
  campos: [
    ...CAMPOS.map(([id, label]) => ({ id, label, tipo: 'moeda', valor: valores[id] ?? 0 })),
    ...extras,
  ],
  observacoes,
})

export const FRETES = [
  ficha('Agro Vale Verde Ltda', { frete_peso: 2850, pedagio: 412.6, ad_valorem: 38.5, gris: 21.4 }, 'Tabela vigente do contrato anual.'),
  ficha('Têxtil Horizonte S.A.', { frete_peso: 3120, pedagio: 412.6, ad_valorem: 52, ajudante: 180, outros: 60 }),
  ficha('Cerâmica Pedra Azul', { frete_peso: 2475, pedagio: 388.2, ad_valorem: 29.9, escolta: 450 }, 'Escolta obrigatória em trechos combinados.'),
  ficha('Indústria Metalúrgica Norte', { frete_peso: 3560, pedagio: 455.8, ad_valorem: 61.3, adc_margem: 95, adc_ls: 120 }),
  ficha('Distribuidora Rio Claro', { frete_peso: 2290, pedagio: 301.4, ad_valorem: 24.8, gris: 18.2 }),
  ficha('Móveis Serra Gaúcha', { frete_peso: 4180, pedagio: 689.9, ad_valorem: 74, ajudante: 220 }, 'Entrega em três contêineres por DTA.', [
    { id: 'custom_lavagem', label: 'Taxa de lavagem', tipo: 'moeda', valor: 140, custom: true },
  ]),
]

export const PEDAGIOS = [
  { nome: 'Porto x Capital · 5 eixos', origem: 'Porto de Santos', pontos: [], destino: 'São Paulo (zona leste)', idaVolta: false, eixos: 5, kmPrevisto: 78, valorTotal: 168.4 },
  { nome: 'Porto x Interior · 5 eixos', origem: 'Porto de Santos', pontos: ['Jundiaí'], destino: 'Campinas', idaVolta: true, eixos: 5, kmPrevisto: 182, valorTotal: 594.2 },
  { nome: 'Porto x Sul · 6 eixos', origem: 'Porto de Santos', pontos: ['Registro', 'Curitiba'], destino: 'Joinville', idaVolta: true, eixos: 6, kmPrevisto: 640, valorTotal: 1103.7 },
  { nome: 'Porto Seco x Capital · 3 eixos', origem: 'Porto Seco Gama', pontos: [], destino: 'Guarulhos', idaVolta: false, eixos: 3, kmPrevisto: 54, valorTotal: 61.3 },
  { nome: 'Capital x Vale · 5 eixos', origem: 'São Paulo (zona leste)', pontos: [], destino: 'São José dos Campos', idaVolta: true, eixos: 5, kmPrevisto: 190, valorTotal: 402.9 },
]
