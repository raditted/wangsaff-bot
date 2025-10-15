import "dotenv/config"
import { handlerSticker } from "./utils/stickerHandler.js"
import { PREFIX, cooldowns, cdDelay } from "./config.js"

export const messagesHandler = async (messages, sock) => {
    const msg = messages.messages?.[0] || messages[0]
    if (!msg?.message || msg.key.fromMe) return

    const sender = msg.key.remoteJid
    if (sender.endsWith("@g.us")) return

    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        ""

    if (!text.startsWith(PREFIX)) return

    const isCD = await cdDelay(sender, sock, msg)
    if (isCD) {
        return; 
    }

    const commandBody = text.slice(PREFIX.length).trim()
    const [command] = commandBody.split(/\s+/)

    const now = Date.now();

    switch (command.toLowerCase()) {
        case "stiker":
        case "sticker":
        case "s": {
            cooldowns.set(sender, now)
            handlerSticker(msg, sock, sender)
            break
        }
    }
}

