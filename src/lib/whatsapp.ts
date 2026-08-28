export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  let number = digits
  if (!number.startsWith('55')) {
    number = '55' + number
  }
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${number}?text=${encoded}`
}

export const MSG_LOJA_ANIVERSARIO =
  'Olá, tudo bem? A equipe JJ/ConstruJota deseja parabéns pelo aniversário da loja. Desejamos muito sucesso e seguimos juntos nessa parceria!'

export const MSG_CONTATO_ANIVERSARIO =
  'Olá, tudo bem? A equipe JJ/ConstruJota deseja feliz aniversário! Que seu dia seja especial e cheio de conquistas.'
