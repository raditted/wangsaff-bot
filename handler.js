import "dotenv/config"
import { handlerSticker } from "./utils/stickerHandler.js"
import { PREFIX, cooldowns, cdDelay } from "./config.js"

export const messagesHandler = async (messages, sock) => {
    const msg = messages.messages?.[0] || messages[0]
    if (!msg?.message || msg.key.fromMe) return

    const sender = msg.key.remoteJid
    if (sender.endsWith("@g.us")) {
        const whitelistedGroups = process.env.WHITELIST_GROUPS?.split(',') || []
        if (!whitelistedGroups.includes(sender)) return
    }

    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        ""

    if (!text.startsWith(PREFIX)) return

    const userJid = msg.key.participant || msg.key.remoteJid

    const commandBody = text.slice(PREFIX.length).trim()
    const [command] = commandBody.split(/\s+/)

    switch (command.toLowerCase()) {
        case "stiker":
        case "sticker":
        case "s": {
            handlerSticker(msg, sock, sender, userJid)
            break
        }
    }
}
