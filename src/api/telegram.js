function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function notifyTelegramLead({ values = {}, serverOk }) {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN?.trim()
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) {
    console.log('telegram: skipped')
    return false
  }

  const fields = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `<b>${escapeHtml(key)}:</b> ${escapeHtml(value)}`)
    .join('\n')

  const status = serverOk ? 'envío al server: exito' : 'envío al server: no disponible'
  const text = `Nuevo lead\n${status}\n\n${fields || 'Sin campos de texto'}`

  const body = new URLSearchParams({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  })

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  return true
}
