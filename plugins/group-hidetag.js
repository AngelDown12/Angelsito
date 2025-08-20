import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = m.text || m.msg?.caption || ''
  if (!/^.?n(\s|$)/i.test(content.trim())) return

  const userText = content.trim().replace(/^.?n\s*/i, '')
  const finalText = userText || ''
  const users = participants.map(u => conn.decodeJid(u.id))

  try {
    const q = m.quoted ? m.quoted : m
    let mtype = q.mtype || ''

    // 🔹 Detectar encuestas DS6 Meta
    if (q.message?.pollCreationMessage) mtype = 'pollCreationMessage'
    if (q.message?.pollUpdateMessage) mtype = 'pollUpdateMessage'

    const isMedia = ['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(mtype)

    // 🔹 Encuesta → mandar texto + firma usando cMod si es mensaje citado
    if (mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage') {
      if (m.quoted && !isMedia) {
        const msg = conn.cMod(
          m.chat,
          generateWAMessageFromContent(
            m.chat,
            { [mtype || 'extendedTextMessage']: q.message?.[mtype] || { text: finalText } },
            { quoted: m, userJid: conn.user.id }
          ),
          `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`,
          conn.user.jid,
          { mentions: users }
        )
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        return
      } else {
        // Si no es mensaje citado, mandar solo texto normal
        await conn.sendMessage(m.chat, {
          text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`,
          mentions: users
        }, { quoted: m })
        return
      }
    }

    // 🔹 Reacción 📢 solo si NO es encuesta
    await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

    // 🔹 Multimedia → mandar archivo + texto + firma
    if (isMedia) {
      const media = await q.download()
      const captionText = `${finalText ? finalText + '\n\n' : ''}> 𝙱𝚄𝚄 𝙱𝙾𝚃`

      if (mtype === 'imageMessage') {
        await conn.sendMessage(m.chat, { image: media, caption: captionText, mentions: users }, { quoted: m })
      } else if (mtype === 'videoMessage') {
        await conn.sendMessage(m.chat, { video: media, caption: captionText, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
      } else if (mtype === 'stickerMessage') {
        await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
        if (finalText) await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })
      } else if (mtype === 'audioMessage') {
        await conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }, { quoted: m })
        if (finalText) await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })
      }
      return
    }

    // 🔹 Mensajes normales → mandar texto
    await conn.sendMessage(m.chat, { text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler