import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import crypto from 'crypto'
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''

  if (!/image|video|webp/.test(mime)) 
    return m.reply('☁️ Responde a una *imagen* o *video* para crear el sticker')

  let media = await q.download()
  if (!media) return m.reply('⚠️ No pude descargar el archivo')

  let stiker

  try {
    if (/image|webp/.test(mime)) {
      // 🚀 instantáneo para imágenes / stickers
      stiker = await sticker(media, false, '', '')
    } else if (/video/.test(mime)) {
      // 📹 ffmpeg optimizado para video → webp
      let tmpIn = path.join(tmpdir(), crypto.randomBytes(6).toString('hex'))
      let tmpOut = `${tmpIn}.webp`
      writeFileSync(tmpIn, media)

      await new Promise((resolve, reject) => {
        spawn('ffmpeg', [
          '-i', tmpIn,
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15',
          '-vcodec', 'libwebp',
          '-loop', '0',
          '-ss', '00:00:00',
          '-t', '00:00:08', // máximo 8s para rapidez
          '-preset', 'ultrafast',
          '-an', '-vsync', '0', tmpOut
        ])
        .on('error', reject)
        .on('close', resolve)
      })

      stiker = tmpOut
    }
  } catch (e) {
    console.error(e)
    return m.reply('⚠️ Error al crear el sticker')
  }

  if (stiker) {
    await conn.sendMessage(m.chat, { sticker: { url: stiker }}, { quoted: m })
  }
}

handler.command = ['s', 'sticker', 'stiker']
export default handler