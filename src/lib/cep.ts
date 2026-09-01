export interface CepAddress {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

interface ViaCepResponse extends CepAddress {
  erro?: boolean
}

export function onlyCepDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 8)
}

export function formatCep(value: string) {
  const digits = onlyCepDigits(value)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export async function fetchAddressByCep(cep: string, signal?: AbortSignal): Promise<CepAddress> {
  const digits = onlyCepDigits(cep)
  if (digits.length !== 8) throw new Error('CEP_INCOMPLETO')

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal })
  if (!response.ok) throw new Error('CEP_INDISPONIVEL')

  const data = (await response.json()) as ViaCepResponse
  if (data.erro) throw new Error('CEP_NAO_ENCONTRADO')

  return data
}
