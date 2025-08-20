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

    // Reacción 📢 si no es encuesta
    if (!(mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage')) {
      await conn.sendMessage(m.chat, { react: { text: '📢', key: m.key } })
    }

    // ENCUESTAS → reemplazar texto directamente
    if (mtype === 'pollCreationMessage' || mtype === 'pollUpdateMessage') {
      const msg = conn.cMod(
        m.chat,
        generateWAMessageFromContent(
          m.chat,
          { [mtype]: { ...q.message[mtype], text: finalText } },
          { quoted: q, userJid: conn.user.id }
        ),
        `${finalText}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`,
        conn.user.jid,
        { mentions: users }
      )
      await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
      return
    }

    // MULTIMEDIA → intentar descargar y mandar
    if (isMedia) {
      let mediaMessage = q.message.imageMessage || q.message.videoMessage || q.message.audioMessage || q.message.stickerMessage || null

      try {
        if (mediaMessage) {
          const media = await conn.downloadMediaMessage({ message: mediaMessage })
          if (mtype === 'imageMessage') {
            await conn.sendMessage(m.chat, { image: media, caption: `${finalText ? finalText + '\n\n' : ''}> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
          } else if (mtype === 'videoMessage') {
            await conn.sendMessage(m.chat, { video: media, caption: `${finalText ? finalText + '\n\n' : ''}> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users, mimetype: 'video/mp4' }, { quoted: m })
          } else if (mtype === 'stickerMessage') {
            await conn.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: m })
            if (finalText) await conn.sendMessage(m.chat, { text: `${finalText}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
          } else if (mtype === 'audioMessage') {
            await conn.sendMessage(m.chat, { audio: media, mimetype: 'audio/ogg; codecs=opus', ptt: true, mentions: users }, { quoted: m })
            if (finalText) await conn.sendMessage(m.chat, { text: `${finalText}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
          }
          return
        }
      } catch {
        // Si falla la descarga, solo enviar texto
        await conn.sendMessage(m.chat, { text: `${finalText}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
        return
      }
    }

    // MENSAJES NORMALES → enviar solo finalText + firma
    await conn.sendMessage(m.chat, { text: `${finalText}\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `📢 Notificación\n\n> 𝙱𝚄𝚄 𝙱𝙾𝚃`, mentions: users }, { quoted: m })
  }
}

handler.customPrefix = /^.?n(\s|$)/i
handler.command = new RegExp
handler.group = true
handler.admin = true

export default handler