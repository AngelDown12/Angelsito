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

    // Preparar captionText (ignorar caption original si empieza con .n)
    let originalCaption = ''
    if (isMedia) {
      originalCaption =
        q.message?.imageMessage?.caption ||
        q.message?.videoMessage?.caption ||
        q.message?.audioMessage?.caption ||
        ''
      if (/^\.?n(\s|$)/i.test(originalCaption)) originalCaption = ''
    }
    const captionText = `${originalCaption ? originalCaption + '\n' : ''}${finalText ? finalText + '\n\n' : ''}> 𝙱𝚄𝚄 𝙱𝙾𝚃`

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

    // MULTIMEDIA → extraer media correctamente para DS6 Meta
    if (isMedia) {
      let mediaMessage
      if (q.message?.imageMessage) mediaMessage = q.message.imageMessage
      else if (q.message?.videoMessage) mediaMessage = q.message.videoMessage
      else if (q.message?.audioMessage) mediaMessage = q.message.audioMessage
      else if (q.message?.stickerMessage) mediaMessage = q.message.stickerMessage

      if (mediaMessage) {
        const media = await conn.downloadMediaMessage({ message: mediaMessage })
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