import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  // Solo acepta imagen, video o webp
  if (!/image|video|webp/.test(mime)) 
    return m.reply('☁️ Responda a una *imagen* o *video* para crear el sticker')

  // Descargar el archivo
  let media = await q.download()
  if (!media) return m.reply('⚠️ No pude descargar el archivo')

  let stiker
  try {
    // Generar el sticker directo del buffer
    stiker = await sticker(media, false, '', '')  
  } catch (e) {
    console.error(e)
    return m.reply('⚠️ Error al crear el sticker')
  }

  if (stiker) 
    await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, true)
}
handler.help = ['s', 'sticker', 'stiker']
handler.tags = ['sticker']
handler.command = ['s', 'sticker', 'stiker']

export default handler