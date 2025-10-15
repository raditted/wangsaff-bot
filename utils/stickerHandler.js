import { Sticker, StickerTypes } from "wa-sticker-formatter"
import { downloadMediaMessage } from "@whiskeysockets/baileys"
import "dotenv/config"
import axios from "axios"
import { createAdReplyContext } from "./contextInfo.js"

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const handlerSticker = async (msg, sock, sender) => {
    await sock.sendMessage(sender, { react: { text: "⏳", key: msg.key } })
    let thumbBuffer = null
    try {
        const thumbnailUrl = process.env.THUMBNAIL_URL
        if (thumbnailUrl) {
        const response = await axios.get(thumbnailUrl, {
            responseType: "arraybuffer",
        })
        thumbBuffer = Buffer.from(response.data, "binary")
        }
    } catch (error) {
        console.error("❌ Error (downloading thumbnail):", error)
    }

    const context = createAdReplyContext(thumbBuffer)

    const isImage =
        msg.message.imageMessage ||
        msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    if (!isImage) {
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

    try {
        await sock.sendMessage(
        sender,
        {
            text: "Keur proses yeuh blog...",
            contextInfo: context,
        },
        { quoted: msg }
        )

        const buffer = await downloadMediaMessage(
        targetMessage,
        "buffer",
        {},
        { reuploadRequest: sock.updateMediaMessage }
        )

        const sticker = new Sticker(buffer, {
            pack: "Saint-Chamond",
            author: "@raditted",
            type: StickerTypes.FULL,
            quality: 80,
        })

        await delay(5000);

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
        await sock.readMessages([msg.key])
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
