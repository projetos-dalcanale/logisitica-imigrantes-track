// Mensagens do login em português, a partir do código de erro do Firebase.
// Código desconhecido cai numa mensagem genérica, sem o texto técnico em inglês.
const MENSAGENS = {
  'auth/user-not-found': 'E-mail ou senha incorretos, ou esta conta ainda não foi cadastrada pelo administrador.',
  'auth/invalid-credential': 'E-mail ou senha incorretos, ou esta conta ainda não foi cadastrada pelo administrador.',
  'auth/wrong-password': 'E-mail ou senha incorretos, ou esta conta ainda não foi cadastrada pelo administrador.',
  'auth/invalid-email': 'Este e-mail não é válido. Confira se digitou certo.',
  'auth/missing-email': 'Digite seu e-mail.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique a rede e tente de novo.',
  'auth/user-disabled': 'Esta conta foi desativada. Fale com o administrador.',
}

export const mensagemDeLogin = (codigo) =>
  MENSAGENS[codigo] || 'Não foi possível concluir agora. Tente de novo em instantes.'
