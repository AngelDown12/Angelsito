import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = m.text || m.msg?.caption || ''
  if (!/^\.?n(\s|$)/i.test(content.trim())) return

  // Reacción
  await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

  const userText = content.trim().replace(/^\.?n\s*/i, '') 
  const finalText = userText || '📢 Notificación'

  try {
    const users = participants.map(u => conn.decodeJid(u.id))

    if (m.quoted) {
      const q = m.quoted
      const mtype = q.mtype || ''
      const originalCaption = (q.msg?.caption || q.text || '').trim()
      const isMedia = ['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(mtype)

      // ⚡️ Encuesta: solo manda texto
      if (mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage') {
        await conn.sendMessage(m.chat, {
          text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`,
          mentions: users
        }, { quoted: m })
        return
      }

      // Media
      if (isMedia) {
        const media = await q.download()
        let msgContent = {}

        if (mtype === 'imageMessage') {
          msgContent = { 
            image: media, 
            caption: `${finalText || originalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, 
            mentions: users 
          }
        } else if (mtype === 'videoMessage') {
          msgContent = { 
            video: media, 
            caption: `${finalText || originalCaption}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, 
            mentions: users, 
            mimetype: 'video/mp4' 
          }
        } else if (mtype === 'stickerMessage') {
          msgContent = { sticker: media, mentions: users }
        } else if (mtype === 'audioMessage') {
          msgContent = { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }
        }

        await conn.sendMessage(m.chat, msgContent, { quoted: m })

        // Si es media que no sea audio, manda también el texto si lo hay
        if (userText && mtype !== 'audioMessage') {
          await conn.sendMessage(m.chat, { 
            text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, 
            mentions: users 
          }, { quoted: m })
        }
        return
      }

      // Texto plano
      await conn.sendMessage(m.chat, { text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
      return
    }

    // Caso sin mensaje citado
    await conn.sendMessage(m.chat, { text: `${finalText}\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })

  } catch (e) {
    const users = participants.map(u => conn.decodeJid(u.id))
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n${'> 𝙱𝚄𝚄 𝙱𝙾𝚃'}`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^\.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler