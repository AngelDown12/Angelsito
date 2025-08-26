let handler = async (m, { conn }) => {
  if (!m.quoted) 
    return conn.reply(m.chat, `☁️ Responde al mensaje que deseas eliminar.`, m, rcanal)

  try {
    const contextInfo = m.message.extendedTextMessage?.contextInfo
    if (!contextInfo) throw new Error('No context info')

    const participant = contextInfo.participant
    const stanzaId = contextInfo.stanzaId

    if (!participant || !stanzaId) throw new Error('Missing participant or stanzaId')

    await conn.sendMessage(m.chat, { 
      delete: { remoteJid: m.chat, fromMe: false, id: stanzaId, participant } 
    })

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch {
    try {
      await conn.sendMessage(m.chat, { delete: m.quoted.vM.key })
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    } catch {
      return conn.reply(m.chat, '☁️ No se pudo eliminar el mensaje.', m, rcanal)
    }
  }
}

handler.customPrefix = /^(?:\.del|del)$/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler