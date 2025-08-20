import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const users = participants.map(u => conn.decodeJid(u.id))

  // 🔹 Extraer texto de .n correctamente en DS6 Meta
  let userText = ''
  if (m.message?.conversation) userText = m.message.conversation
  else if (m.message?.extendedTextMessage?.text) userText = m.message.extendedTextMessage.text
  else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
    userText = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation
  }
  userText = userText.trim().replace(/^\.?n\s*/i, '')
  const finalText = userText || '📢 Notificación'

  try {
    const q = m.quoted ? m.quoted : m
    const mtype = q.mtype || ''

    // 🔹 Bloque especial para encuestas
    if (m.quoted && (mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage')) {
      // Reaccionar al mensaje original
      await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

      // Enviar el texto del .n
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
      if (mtype === 'audioMessage') {
        try {
          const media = await q.download()
          await conn.sendMessage(m.chat, { 
            audio: media, 
            mimetype: 'audio/ogg; codecs=opus', 
            ptt: true, 
            mentions: users 
          }, { quoted: m })

          if (userText) {
            await conn.sendMessage(m.chat, { 
              text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, 
              mentions: users 
            }, { quoted: m })
          }
        } catch {
          await conn.sendMessage(m.chat, { text: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
        }
      } else {
        const media = await q.download()
        if (mtype === 'imageMessage') await conn.sendMessage(m.chat, { image: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
        else if (mtype === 'videoMessage') await conn.sendMessage(m.chat, { video: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
        else if (mtype === 'stickerMessage') await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
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
      if (mtype === 'audioMessage') {
        try {
          const media = await m.download()
          await conn.sendMessage(m.chat, { 
            audio: media, 
            mimetype: 'audio/ogg; codecs=opus', 
            ptt: true, 
            mentions: users 
          }, { quoted: m })

          if (userText) {
            await conn.sendMessage(m.chat, { 
              text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, 
              mentions: users 
            }, { quoted: m })
          }
        } catch {
          await conn.sendMessage(m.chat, { text: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
        }
      } else {
        const media = await m.download()
        if (mtype === 'imageMessage') await conn.sendMessage(m.chat, { image: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
        else if (mtype === 'videoMessage') await conn.sendMessage(m.chat, { video: media, caption: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
        else if (mtype === 'stickerMessage') await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
      }

    } else {
      await conn.sendMessage(m.chat, { text: `${finalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
    }

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler