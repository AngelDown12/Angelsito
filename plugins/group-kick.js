const handler = async (m, { conn }) => {
  const target = (m.mentionedJid && m.mentionedJid.length)
    ? m.mentionedJid[0]
    : m.quoted?.sender;

  if (!target) return m.reply('_Menciona o responde al usuario que deseas eliminar._');

  try {
    await conn.groupParticipantsUpdate(m.chat, [target], 'remove');
    return m.reply('☠️ Intruso eliminado.');
  } catch {
    return global.dfail('botAdmin', m, conn);
  }
};

handler.customPrefix = /^(?:\.?kick)(?:\s+|$)/i;
handler.command = new RegExp();
handler.group = true;
handler.admin = true;

export default handler;