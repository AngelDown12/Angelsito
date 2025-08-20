import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = m.text || m.msg?.caption || ''
  if (!/^\.?n(\s|$)/i.test(content.trim())) return

  await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

  const userText = content.trim().replace(/^\.?n\s*/i, '') 
  const users = participants.map(u => conn.decodeJid(u.id))
  const q = m.quoted ? m.quoted : m

  try {
    const mtype = q.mtype || '' 
    const isMedia = ['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(mtype)
    const originalCaption = (q.msg?.caption || q.text || '').trim()
    const finalCaption = userText || originalCaption || '📢 Notificación'

    // 🚩 Detectar si es link
    const isLink = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i.test(finalCaption)

    if (isLink) {
      // 🚩 Clonar mensaje original para forzar vista previa
      const msg = generateWAMessageFromContent(
        m.chat,
        q.message || { extendedTextMessage: { text: finalCaption } },
        { userJid: conn.user.id }
      )
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

      // Extra notificación
      await conn.sendMessage(m.chat, {
        text: `📢 Notificación\n\n${'> 𝐛𝐮𝐮 𝐛𝐨𝐭 🔮'}`,
        mentions: users
      }, { quoted: m })
      return
    }

    if (m.quoted && isMedia) {
      const media = await q.download()
      if (mtype === 'imageMessage') {
        await conn.sendMessage(m.chat, { image: media, caption: `${finalCaption}\n\n${'> 𝐛𝐮𝐮 𝐛𝐨𝐭 🔮'}`, mentions: users }, { quoted: m })
      } else if (mtype === 'videoMessage') {
        await conn.sendMessage(m.chat, { video: media, caption: `${finalCaption}\n\n${'> 𝐛𝐮𝐮 𝐛𝐨𝐭 🔮'}`, mentions: users }, { quoted: m })
      } else if (mtype === 'stickerMessage') {
        await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
      } else if (mtype === 'audioMessage') {
        await conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }, { quoted: m })
      }
    } else {
      await conn.sendMessage(m.chat, {
        text: `${finalCaption}\n\n${'> 𝐛𝐮𝐮 𝐛𝐨𝐭 🔮'}`,
        mentions: users
      }, { quoted: m })
    }

  } catch (e) {
    await conn.sendMessage(m.chat, {
      text: `📢 Notificación\n\n${'> 𝐛𝐮𝐮 𝐛𝐨𝐭 🔮'}`,
      mentions: participants.map(u => conn.decodeJid(u.id))
    }, { quoted: m })
  }
}

handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler