import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const content = m.text || m.msg?.caption || ''
  if (!/^.?n(\s|$)/i.test(content.trim())) return

  const finalText = content.trim().replace(/^.?n\s*/i, '')
  const users = participants.map(u => conn.decodeJid(u.id))

  try {
    const q = m.quoted ? m.quoted : m
    let mtype = q.mtype || ''

    // Detectar encuestas DS6 Meta
    if (q.message?.pollCreationMessage) mtype = 'pollCreationMessage'
    if (q.message?.pollUpdateMessage) mtype = 'pollUpdateMessage'

    const isMedia = ['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(mtype)

    // EXTRAER TEXTO REAL DE LA MEDIA O EXTENDED TEXT
    let mediaCaption = ''
    let mediaMessage = null

    if (q.message?.imageMessage) {
      mediaCaption = q.message.imageMessage.caption || q.message.extendedTextMessage?.text || ''
      mediaMessage = q.message.imageMessage
    } else if (q.message?.videoMessage) {
      mediaCaption = q.message.videoMessage.caption || q.message.extendedTextMessage?.text || ''
      mediaMessage = q.message.videoMessage
    } else if (q.message?.audioMessage) {
      mediaCaption = q.message.audioMessage.caption || q.message.extendedTextMessage?.text || ''
      mediaMessage = q.message.audioMessage
    } else if (q.message?.stickerMessage) {
      mediaMessage = q.message.stickerMessage
      mediaCaption = q.message.extendedTextMessage?.text || ''
    } else if (q.message?.extendedTextMessage) {
      mediaCaption = q.message.extendedTextMessage.text || ''
    }

    // Ignorar captions que empiezan con .n
    if (/^\.?n(\s|$)/i.test(mediaCaption)) mediaCaption = ''

    const captionText = `${mediaCaption ? mediaCaption + '\n' : ''}${finalText ? finalText + '\n\n' : ''}> 𝙱𝚄𝚄 𝙱𝙾𝚃`

    // ENCUESTAS → reemplazar texto directamente
    if (mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage') {
      const msg = conn.cMod(
        m.chat,
        generateWAMessageFromContent(
          m.chat,
          { [mtype]: { ...q.message[mtype], text: finalText } },
          { quoted: q, userJid: conn.user.id }
        ),
        captionText,
        conn.user.jid,
        { mentions: users }
      )
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
      return
    }

    // Reacción 📢 si no es encuesta
    await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })

    // MULTIMEDIA → enviar solo si se descarga correctamente
    if (isMedia && mediaMessage) {
      try {
        const media = await conn.downloadMediaMessage({ message: mediaMessage })

        if (mtype === 'imageMessage') {
          await conn.sendMessage(m.chat, { image: media, caption: captionText, mentions: users }, { quoted: m })
        } else if (mtype === 'videoMessage') {
          await conn.sendMessage(m.chat, { video: media, caption: captionText, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
        } else if (mtype === 'stickerMessage') {
          await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
          if (finalText || mediaCaption) await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })
        } else if (mtype === 'audioMessage') {
          await conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }, { quoted: m })
          if (finalText || mediaCaption) await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })
        }

        return
      } catch {
        // Si falla la descarga, mandar solo texto
        await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })
        return
      }
    }

    // MENSAJES NORMALES → enviar solo finalText + firma
    await conn.sendMessage(m.chat, { text: captionText, mentions: users }, { quoted: m })

  } catch (e) {
    // Solo enviar "Notificación" en caso de error real
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler