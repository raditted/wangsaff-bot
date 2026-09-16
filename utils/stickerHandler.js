import { Sticker, StickerTypes } from "wa-sticker-formatter"
import { downloadMediaMessage } from "@whiskeysockets/baileys"
import "dotenv/config"
import { createAdReplyContext } from "./contextInfo.js"
import { cooldowns, cdDelay } from "../config.js"

const MAX_IMAGE_SIZE = 2 * 1024 * 1024

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Download timeout')), ms)
        ),
    ])

export const handlerSticker = async (msg, sock, sender, userJid) => {
    await sock.sendMessage(sender, { react: { text: "⏳", key: msg.key } })

    const context = createAdReplyContext()

    const isImage =
        msg.message.imageMessage ||
        msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    if (!isImage) {
        const isCD = await cdDelay(userJid, sender, sock, msg, '_instruction', 5)
        if (isCD) return

        cooldowns.set(userJid + '_instruction', { time: Date.now(), duration: 5, warned: false })

        await sock.sendMessage(sender, { react: { text: "❌", key: msg.key } })
        try {
        await sock.sendMessage(
            sender,
            {
            text: `> *Kirim gambar sia jeung caption atawa reply gambar anu antos di send ka WA ku panitah ieu:*\n\`\`\`\n.sticker\n.stiker\n.s\n\`\`\``,
            contextInfo: context,
            },
            { quoted: msg }
        )
        } catch (err) {
        console.error("❌ Error (send format):", err)
        }
        return
    }

    const targetMessage = msg.message.imageMessage
        ? msg
        : { message: msg.message.extendedTextMessage?.contextInfo?.quotedMessage }

    const isCD = await cdDelay(userJid, sender, sock, msg, '_sticker', 60)
    if (isCD) return

    try {
        const buffer = await withTimeout(
            downloadMediaMessage(
                targetMessage,
                "buffer",
                {},
                { reuploadRequest: sock.updateMediaMessage }
            ),
            30_000
        )

        if (buffer.length > MAX_IMAGE_SIZE) {
            await sock.sendMessage(sender, { react: { text: "❌", key: msg.key } })
            await sock.sendMessage(sender, {
                text: "❌ Gambar terlalu besar (max 2MB).",
                contextInfo: context,
            }, { quoted: msg })
            return
        }

        const sticker = new Sticker(buffer, {
            pack: "Saint-Chamond",
            author: "@raditted",
            type: StickerTypes.FULL,
            quality: 80,
        })

        const stickerBuffer = await sticker.build()
        await sock.sendMessage(
        sender,
        {
            sticker: stickerBuffer,
        },
        {
            quoted: msg,
        }
        )
        await sock.sendMessage(sender, { react: { text: "✅", key: msg.key } })

        cooldowns.set(userJid + '_sticker', { time: Date.now(), duration: 60, warned: false })
    } catch (error) {
        console.error("Error (create sticker):", error)
        await sock.sendMessage(
        sender,
        {
            text: "❌Moal Baleg, error.",
            react: { text: "❌", key: msg.key },
            contextInfo: context,
        },
        { quoted: msg }
        )
    }
}

