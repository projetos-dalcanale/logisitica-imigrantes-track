// COMPROMISSOS DOS PRÓXIMOS DIAS (gráfico do Início): quantos compromissos
// pendentes cada dia tem, separados em importação e exportação. Segue a mesma
// regra da agenda (etapas.js): o atrasado (pendente cujo horário passou) e o
// que já foi feito ficam de fora; o atrasado já aparece na própria seção.
import { compromissos } from './etapas'

const pad = (n) => String(n).padStart(2, '0')
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export const compromissosPorDia = (processes, now = Date.now(), dias = 7) => {
  // Início de cada dia pelo calendário (não soma 24 h: mudança de horário de verão).
  const inicios = Array.from({ length: dias + 1 }, (_, i) => {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    return d
  })
  const lista = inicios.slice(0, dias).map((d, i) => ({
    inicio: d.getTime(),
    rotulo: `${DIAS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
    hoje: i === 0,
    importacao: 0,
    exportacao: 0,
    total: 0,
    itens: [],
  }))

  for (const proc of processes) {
    if (proc.status !== 'active') continue
    for (const c of compromissos(proc)) {
      if (c.feito || (c.pendente && c.t < now)) continue
      const i = inicios.findIndex((d, k) => k < dias && c.t >= d.getTime() && c.t < inicios[k + 1].getTime())
      if (i === -1) continue
      const dia = lista[i]
      dia[proc.type === 'import' ? 'importacao' : 'exportacao']++
      dia.total++
      dia.itens.push({ ...c, proc })
    }
  }
  lista.forEach((d) => d.itens.sort((a, b) => a.t - b.t))
  return lista
}
