import axios from 'axios'
import { sticker } from '../lib/sticker.js'

async function niceName(jid, conn, fallback = '') {
  try {
    const g = await conn.getName(jid)
    if (g && g.trim() && !/^\d+$/.test(g) && !g.includes('@')) return g
  } catch {}
  const c = conn.contacts?.[jid]
  if (c?.notify && !/^\d+$/.test(c.notify)) return c.notify
  if (c?.name && !/^\d+$/.test(c.name)) return c.name
  if (fallback && fallback.trim() && !/^\d+$/.test(fallback)) return fallback
  return jid.split('@')[0]
}

const colors = {
  rojo: '#FF0000',
  azul: '#0000FF',
  morado: '#800080',
  verde: '#008000',
  amarillo: '#FFFF00',
  naranja: '#FFA500',
  celeste: '#00FFFF',
  rosado: '#FFC0CB',
  negro: '#000000'
}

const handler = async (msg, { conn, args }) => {
  try {
    const chatId = msg.key.remoteJid
    const contentFull = args.join(' ').trim()

    const ctx = msg.message?.extendedTextMessage?.contextInfo
    const mentioned = ctx?.mentionedJid || []
    const quotedMsg = ctx?.participant

    let targetJid = msg.key.participant || msg.key.remoteJid

    if (mentioned[0]) {
      targetJid = mentioned[0]
    } else if (quotedMsg) {
      targetJid = quotedMsg
    }

    if (!contentFull && !ctx?.quotedMessage) {
      return conn.sendMessage(chatId, {
        text: `✏️ Usa qc así:\n\n*• qc [texto]*\n*• qc [@user texto]*\n(ó responde a un mensaje con .qc [texto])`
      }, { quoted: msg })
    }

    const firstWord = contentFull.split(' ')[0]?.toLowerCase()
    const bgColor = colors[firstWord] || colors['negro']

    let content = contentFull
    if (colors[firstWord]) {
      content = contentFull.split(' ').slice(1).join(' ').trim()
    }

    const plain = content.replace(/@[\d\-]+/g, '').trim() || 
                  ctx?.quotedMessage?.conversation || ' '

    const displayName = await niceName(targetJid, conn)
    let avatar = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
    try { avatar = await conn.profilePictureUrl(targetJid, 'image') } catch {}

    await conn.sendMessage(chatId, { react: { text: '🎨', key: msg.key } })

    const quoteData = {
      type: 'quote',
      format: 'png',
      backgroundColor: bgColor,
      width: 600,
      height: 900,
      scale: 3,
      messages: [{
        entities: [],
        avatar: true,
        from: { id: 1, name: displayName, photo: { url: avatar } },
        text: plain,
        replyMessage: {}
      }]
    }

    const { data } = await axios.post(
      'https://bot.lyo.su/quote/generate',
      quoteData,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const stickerBuf = Buffer.from(data.result.image, 'base64')
    const finalSticker = await sticker(stickerBuf, false, {
      packname: 'Azura Ultra 2.0 Bot',
      author: '𝙍𝙪𝙨𝙨𝙚𝙡𝙡 xz 💻'
    })

    await conn.sendMessage(chatId, { sticker: finalSticker }, { quoted: msg })
    await conn.sendMessage(chatId, { react: { text: '✅', key: msg.key } })

  } catch (e) {
    console.error('❌ Error en qc:', e)
    await conn.sendMessage(msg.key.remoteJid, { text: '❌ Error al generar el sticker.' }, { quoted: msg })
  }
}

handler.command = ['qc']
export default handler