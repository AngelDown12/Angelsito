import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = m.text || m.msg?.caption || ''
  if (!/^.?n(\s|$)/i.test(content.trim())) return

  const userText = content.trim().replace(/^.?n\s*/i, '')
  const finalText = userText || ''
  const users = participants.map(u => conn.decodeJid(u.id))

  try {
    // 🔹 Detectar mensaje citado
    let q = m.quoted ? m.quoted : m
    let mtype = q.mtype || ''

    // 🔹 Detectar encuestas dentro de contextInfo (DS6 Meta)
    if (m.quoted?.message?.pollCreationMessage) mtype = 'pollCreationMessage'
    if (m.quoted?.message?.pollUpdateMessage) mtype = 'pollUpdateMessage'

    // 🔹 Bloque especial para encuestas
    if (mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage') {
      await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })
      await conn.sendMessage(m.chat, {
        text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`,
        mentions: users
      }, { quoted: m })
      return
    }

    // 🔹 Reaccionar normalmente a cualquier otro mensaje
    await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

    const isMedia = ['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(mtype)
    const originalCaption = (q.msg?.caption || q.text || '').trim()
    const finalCaption = finalText || originalCaption || '📢 Notificación'

    if (m.quoted && isMedia) {
      const media = await q.download()
      if (mtype === 'imageMessage') {
        await conn.sendMessage(m.chat, { image: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
      } else if (mtype === 'videoMessage') {
        await conn.sendMessage(m.chat, { video: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
      } else if (mtype === 'stickerMessage') {
        await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
      } else if (mtype === 'audioMessage') {
        await conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }, { quoted: m })
        if (finalText) {
          await conn.sendMessage(m.chat, { text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
        }
      }
    } else if (m.quoted && !isMedia) {
      const msg = conn.cMod(
        m.chat,
        generateWAMessageFromContent(
          m.chat,
          { [mtype || 'extendedTextMessage']: q.message?.[mtype] || { text: finalCaption } },
          { quoted: m, userJid: conn.user.id }
        ),
        `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`,
        conn.user.jid,
        { mentions: users }
      )
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    } else if (!m.quoted && isMedia) {
      const media = await m.download()
      if (mtype === 'imageMessage') {
        await conn.sendMessage(m.chat, { image: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
      } else if (mtype === 'videoMessage') {
        await conn.sendMessage(m.chat, { video: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
      } else if (mtype === 'stickerMessage') {
        await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
      } else if (mtype === 'audioMessage') {
        await conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }, { quoted: m })
        if (finalText) {
          await conn.sendMessage(m.chat, { text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
        }
      }
    } else {
      await conn.sendMessage(m.chat, { text: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
    }

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler