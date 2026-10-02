import { IconPackageExport, IconPackageImport } from '@tabler/icons-react'

// Ícones de Importação e Exportação (caixa com a carga entrando e saindo).
// Vêm do Tabler, mas aceitam as mesmas props dos ícones do lucide
// (className, strokeWidth), então são usados do mesmo jeito no app.
export function ImportIcon({ strokeWidth = 2, ...props }) {
  return <IconPackageImport stroke={strokeWidth} {...props} />
}

export function ExportIcon({ strokeWidth = 2, ...props }) {
  return <IconPackageExport stroke={strokeWidth} {...props} />
}
