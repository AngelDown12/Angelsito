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
    const originalCaption = (q.msg?.caption || q.text || '').trim()
    const captionText = `${originalCaption ? originalCaption + '\n' : ''}${finalText ? finalText + '\n\n' : ''}> 𝙱𝚄𝚄 𝙱𝙾𝚃`

    // 🔹 Si hay mensaje citado, usar cMod para mantener todo intacto (encuestas, texto, multimedia)
    if (m.quoted) {
      const msg = conn.cMod(
        m.chat,
        generateWAMessageFromContent(
          m.chat,
          { [mtype || 'extendedTextMessage']: q.message?.[mtype] || { text: finalText } },
          { quoted: m, userJid: conn.user.id }
        ),
        captionText,
        conn.user.jid,
        { mentions: users }
      )
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
      return
    }

    // 🔹 Reacción 📢 solo si no hay mensaje citado
    await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

    // 🔹 Multimedia sin mensaje citado
    if (isMedia) {
      const media = await q.download()
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

    // 🔹 Si no hay mensaje citado ni multimedia → enviar texto normal
    await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler