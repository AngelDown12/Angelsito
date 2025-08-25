import { sticker } from '../lib/sticker.js'
import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        let targetUser
        let text

        if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetUser = m.mentionedJid[0]
            text = args.slice(1).join(' ')
        } 
        else if (m.quoted) {
            targetUser = m.quoted.sender
            text = args.join(' ')
        } 
        else {
            targetUser = m.sender
            text = args.join(' ')
        }

        if (!text || !text.trim()) {
            return conn.reply(m.chat, `☁️ *Agrega un texto para crear el sticker*\n\n📌 Ejemplo:\n${usedPrefix + command} @usuario Hola!`, m)
        }

        const wordCount = text.trim().split(/\s+/).length
        if (wordCount > 30) {
            return conn.reply(m.chat, '⚠️ *Máximo 30 palabras permitidas*', m)
        }

        let name
        try {
            name = await conn.getName(targetUser)
        } catch {
            name = 'Usuario'
        }

        let pp
        try {
            pp = await conn.profilePictureUrl(targetUser, 'image')
            if (!pp || !pp.startsWith('http')) throw new Error('Invalid URL')
        } catch {
            pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
        }

        const obj = {
            type: "quote",
            format: "png",
            backgroundColor: "#000000",
            width: 512,
            height: 768,
            scale: 2,
            messages: [{
                entities: [],
                avatar: true, // 🔥 aseguramos que tenga avatar
                from: {
                    id: 1,
                    name,
                    photo: { url: pp } // 🔥 la URL ya validada
                },
                text,
                replyMessage: {}
            }]
        }

        await conn.sendMessage(m.chat, { react: { text: '🎨', key: m.key } })

        let json
        try {
            json = await axios.post('https://bot.lyo.su/quote/generate', obj, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            })
        } catch (e) {
            console.error("Error API:", e)
            return conn.reply(m.chat, '❌ *Error al generar el sticker. Intenta de nuevo más tarde.*', m)
        }

        if (!json?.data?.result?.image) {
            return conn.reply(m.chat, '❌ *No se pudo generar el sticker (respuesta inválida)*', m)
        }

        let buffer
        try {
            buffer = Buffer.from(json.data.result.image, 'base64')
        } catch {
            return conn.reply(m.chat, '⚠️ *Error al procesar la imagen.*', m)
        }

        let stiker
        try {
            stiker = await sticker(buffer, false, '', '')
        } catch {
            return conn.reply(m.chat, '⚠️ *Error al convertir a sticker.*', m)
        }

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