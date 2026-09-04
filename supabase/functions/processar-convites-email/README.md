# Processador de convites por e-mail

Esta Edge Function consome `public.convites_email` em lotes de 25 e encaminha cada mensagem para um servidor HTTP de e-mails. Nenhuma mensagem é enviada enquanto a função não for publicada, configurada e chamada.

O servidor configurado em `EMAIL_SERVER_URL` deve aceitar `POST` JSON neste formato:

```json
{
  "from": { "email": "relaciona@empresa.com", "name": "ConstruJota Relaciona" },
  "to": { "email": "cliente@empresa.com", "name": "Cliente" },
  "subject": "Convite: Nome do treinamento",
  "template": "convite_treinamento",
  "data": {
    "treinamento": "Nome do treinamento",
    "tema": "Tema",
    "data": "2026-09-20",
    "horario": "14:00:00",
    "local": "Auditório",
    "nome": "Cliente"
  },
  "metadata": {
    "conviteId": "uuid",
    "treinamentoId": "uuid",
    "lojaId": "uuid",
    "contatoId": "uuid ou null"
  }
}
```

O endpoint deve responder com HTTP `2xx`. Opcionalmente, pode retornar `{ "id": "identificador-do-provedor" }`.

Segredos necessários: `EMAIL_SERVER_URL`, `EMAIL_SERVER_TOKEN`, `EMAIL_FROM`, `EMAIL_FROM_NAME` e `EMAIL_WORKER_SECRET`. Quando `EMAIL_REQUIRE_VALIDATION=true`, somente filas com `email_validado=true` são processadas.
