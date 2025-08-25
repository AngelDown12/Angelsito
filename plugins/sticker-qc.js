import { sticker } from '../lib/sticker.js'
import axios from 'axios'
import FormData from 'form-data'
import fetch from 'node-fetch'

async function uploadToTelegraph(buffer) {
    let form = new FormData()
    form.append('file', buffer, 'file.png')
    let res = await axios.post('https://telegra.ph/upload', form, {
        headers: form.getHeaders()
    })
    return 'https://telegra.ph' + res.data[0].src
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        let targetUser
        let text

        // Determinar usuario objetivo y texto
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetUser = m.mentionedJid[0]
            text = args.slice(1).join(' ')
        } else if (m.quoted) {
            targetUser = m.quoted.sender
            text = args.join(' ')
        } else {
            targetUser = m.sender
            text = args.join(' ')
        }

        // Validar texto
        if (!text || !text.trim()) {
            return conn.reply(m.chat, `☁️ *Agrega un texto para crear el sticker*\n\n📌 Ejemplo:\n${usedPrefix + command} @usuario Hola!`, m)
        }

        const wordCount = text.trim().split(/\s+/).length
        if (wordCount > 30) {
            return conn.reply(m.chat, '⚠️ *Máximo 30 palabras permitidas*', m)
        }

        // Obtener nombre del usuario
        let name
        try {
            name = await conn.getName(targetUser)
        } catch {
            name = 'Usuario'
        }

        // Obtener foto de perfil
        let pp
        try {
            let ppUrl = await conn.profilePictureUrl(targetUser, 'image')
            if (ppUrl) {
                let resp = await fetch(ppUrl)
                let buffer = await resp.buffer()
                pp = await uploadToTelegraph(buffer) // sube foto real
            }
        } catch {
            pp = null
        }

        // Si no tiene foto, usar avatar genérico
        if (!pp) {
            pp = 'https://files.catbox.moe/jknpio.jpg'
        }

        // Preparar objeto para generar quote
        const obj = {
            type: "quote",
            format: "png",
            backgroundColor: "#000000",
            width: 512,
            height: 768,
            scale: 2,
            messages: [{
                entities: [],
                avatar: true,
                from: {
                    id: 1,
                    name,
                    photo: { url: pp }
                },
                text,
                replyMessage: {}
            }]
        }

        // Reacción de creación
        await conn.sendMessage(m.chat, { react: { text: '🎨', key: m.key } })

        // Generar quote
        let json = await axios.post('https://bot.lyo.su/quote/generate', obj, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        })

        if (!json?.data?.result?.image) {
            return conn.reply(m.chat, '❌ *No se pudo generar el sticker (respuesta inválida)*', m)
        }

        // Convertir a sticker y enviar
        let buffer = Buffer.from(json.data.result.image, 'base64')
        let stiker = await sticker(buffer, false, '', '')

        if (stiker) {
            await conn.sendFile(m.chat, stiker, 'Quotly.webp', '', m, true, { asSticker: true })
            await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        } else {
            conn.reply(m.chat, '❌ *No se pudo crear el sticker.*', m)
        }

    } catch (err) {
        console.error("Error handler qc:", err)
        conn.reply(m.chat, '❌ *Ocurrió un error inesperado.*', m)
    }
}

handler.help = ['qc']
handler.tags = ['sticker']
handler.command = /^(qc)$/i

export default handler