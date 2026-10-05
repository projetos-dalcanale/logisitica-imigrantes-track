import { useState } from 'react'

// Campo que salva sozinho: guarda o texto localmente enquanto a pessoa digita
// e só grava ao sair do campo (ou a cada mudança, com saveOnChange — usado
// nos campos de data/hora). Se o valor mudar no Firestore (outra aba, outra
// pessoa), o campo acompanha. Se onSave devolver false, volta ao valor salvo.
export default function AutoSaveInput({ value = '', onSave, saveOnChange = false, transform, as: Tag = 'input', ...rest }) {
  const [local, setLocal] = useState(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setLocal(value)
  }

  const commit = async (v) => {
    if (v === value) return
    const ok = await onSave(v)
    if (ok === false) setLocal(value)
  }

  return (
    <Tag
      autoComplete="off"
      spellCheck={Tag === 'textarea'}
      {...rest}
      value={local}
      onChange={(e) => {
        const v = transform ? transform(e.target.value) : e.target.value
        setLocal(v)
        if (saveOnChange) commit(v)
      }}
      onBlur={() => {
        if (!saveOnChange) commit(local)
      }}
    />
  )
}
