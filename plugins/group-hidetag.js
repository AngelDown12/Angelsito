import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = m.text || m.msg?.caption || ''
  if (!/^.?n(\s|$)/i.test(content.trim())) return

  await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

  const userText = content.trim().replace(/^.?n\s*/i, '')
  const finalText = userText || ''
  const users = participants.map(u => conn.decodeJid(u.id))

  try {
    // 🔎 Detectamos si contiene link de invitación
    const inviteRegex = /(https?:\/\/chat\.whatsapp\.com\/[0-9A-Za-z]+)/i
    const match = finalText.match(inviteRegex)

    if (match) {
      const inviteLink = match[1]

      // 1️⃣ Mandar el link con vista previa oficial
      await conn.sendMessage(m.chat, { 
        text: inviteLink, 
        linkPreview: true 
      }, { quoted: m })

      // 2️⃣ Mandar el texto de notificación con mentions
      await conn.sendMessage(m.chat, { 
        text: `📢 Notificación\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, 
        mentions: users 
      }, { quoted: m })

      return
    }

    // 🖼️ Si no hay link, sigue con el comportamiento original
    const q = m.quoted ? m.quoted : m
    const mtype = q.mtype || ''
    const isMedia = ['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(mtype)
    const originalCaption = (q.msg?.caption || q.text || '').trim()
    const finalCaption = finalText || originalCaption || '📢 Notificación'

    if (m.quoted && isMedia) {
      const media = await q.download()
      if (mtype === 'imageMessage') {
        await conn.sendMessage(m.chat, { 
          image: media, 
          caption: `${finalCaption}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, 
          mentions: users 
        }, { quoted: m })
      } else if (mtype === 'videoMessage') {
        await conn.sendMessage(m.chat, { 
          video: media, 
          caption: `${finalCaption}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, 
          mentions: users 
        }, { quoted: m })
      } else if (mtype === 'stickerMessage') {
        await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
      } else if (mtype === 'audioMessage') {
        await conn.sendMessage(m.chat, { 
          audio: media, 
          mimetype: 'audio/ogg; codecs=opus', 
          ptt: true, 
          mentions: users 
        }, { quoted: m })
      }
    } else {
      await conn.sendMessage(m.chat, { 
        text: `${finalCaption}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, 
        mentions: users 
      }, { quoted: m })
    }
  } catch (e) {
    await conn.sendMessage(m.chat, {
      text: `📢 Notificación\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`,
      mentions: users
    }, { quoted: m })
  }
}

handler.customPrefix = /^.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler