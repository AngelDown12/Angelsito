let handler = async (m, { conn }) => {
    let week = new Date().toLocaleDateString('es', { weekday: 'long' })
    let date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

    let menu = `
¡Hola! 👋🏻 @${m.sender.split("@")[0]}

\`\`\`${week}, ${date}\`\`\`

╭──𝗠𝗘𝗡𝗨 𝗛𝗢𝗧──────
│ 𝘉𝘪𝘦𝘯𝘷𝘦𝘯𝘪𝘥𝘰 ...
│ 𝘋𝘢𝘭𝘦 𝘤𝘢𝘳𝘪𝘯̃𝘰 𝘢 𝘵𝘶 𝘨𝘢𝘯𝘻𝘰 
│ 𝘤𝘰𝘯 𝘦𝘭 𝘮𝘦𝘯𝘶 𝘩𝘰𝘵.
╰────────────────

» 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦 𝗛𝗢𝗧 
│🔥➺ .𝘩𝘰𝘵𝘵𝘪𝘬𝘵𝘰𝘬
│🔥➺ .𝘵𝘦𝘵𝘢𝘴
│🔥➺ .𝘱𝘢𝘤𝘬
│🔥➺ .𝘹𝘷𝘪𝘥𝘦𝘰𝘴
│🔥➺ .𝘩𝘦𝘯𝘵𝘢𝘪𝘱𝘥𝘧
│🔥➺ .𝘹𝘯𝘹𝘹𝘹 𝘭𝘪𝘯𝘬
│🔥➺ .𝘹𝘯𝘹𝘹𝘴𝘦𝘢𝘳𝘤𝘩 𝘵𝘦𝘹𝘵𝘰
│🔥➺ .𝘩𝘦𝘯𝘵𝘢𝘪𝘴𝘦𝘢𝘳𝘤𝘩 𝘵𝘦𝘹𝘵𝘰
│🔥➺ .𝘱𝘰𝘳𝘯𝘩𝘶𝘣𝘴𝘦𝘢𝘳𝘤𝘩 𝘵𝘦𝘹𝘵𝘰
╰━━━━━━⋆★⋆━━━━━━⬣

» 𝗧𝗥𝗜𝗣𝗘 𝗫
│🔞➺ .𝘯𝘴𝘧𝘸𝘭𝘰𝘭𝘪
│🔞➺ .𝘯𝘴𝘧𝘸𝘧𝘰𝘰𝘵
│🔞➺ .𝘯𝘴𝘧𝘸𝘢𝘴𝘴
│🔞➺ .𝘯𝘴𝘧𝘸𝘣𝘥𝘴𝘮
│🔞➺ .𝘯𝘴𝘧𝘸𝘤𝘶𝘮
│🔞➺ .𝘯𝘴𝘧𝘸𝘦𝘳𝘰
│🔞➺ .𝘯𝘴𝘧𝘸𝘧𝘦𝘮𝘥𝘰𝘮
│🔞➺ .𝘯𝘴𝘧𝘸𝘧𝘰𝘰𝘵
│🔞➺ .𝘯𝘴𝘧𝘸𝘨𝘭𝘢𝘴𝘴
│🔞➺ .𝘯𝘴𝘧𝘸𝘰𝘳𝘨𝘺
│🔞➺ .𝘺𝘶𝘳𝘪
│🔞➺ .𝘺𝘶𝘳𝘪2
│🔞➺ .𝘺𝘶𝘳𝘪2
│🔞➺ .𝘺𝘢𝘰𝘪
│🔞➺ .𝘺𝘢𝘰𝘪2
│🔞➺ .𝘣𝘰𝘰𝘵𝘺
│🔞➺ .𝘦𝘤𝘤𝘩𝘪
│🔞➺ .𝘧𝘶𝘳𝘳𝘰
│🔞➺ .𝘩𝘦𝘯𝘵𝘢𝘪
│🔞➺ .𝘵𝘳𝘢𝘱𝘪𝘵𝘰
╰━━━━━━⋆★⋆━━━━━━⬣
`.trim()

    const vi = ['https://telegra.ph/file/aa3e11b1cc4246ad72b9b.mp4']

    await conn.sendMessage(m.chat, {
    video: { url: vi[0] },
    caption: menu,
    mentions: [m.sender],
    gifPlayback: true
}, { quoted: m })
}

handler.command = /^menuhot$/i
export default handler