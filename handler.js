import { Sticker, StickerTypes } from "wa-sticker-formatter"
import "dotenv/config"
import { PREFIX } from "./config.js"
import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import { createAdReplyContext } from "./utils/contextInfo.js"

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

    const commandBody = text.slice(PREFIX.length).trim()
    const [command] = commandBody.split(/\s+/)

    switch (command.toLowerCase()) {
        case "stiker":
        case "sticker":
        case "s": {
            await sock.sendMessage(sender, { react: { text: "⏳", key: msg.key } })

            const isImage =
                msg.message.imageMessage ||
                msg.message.extendedTextMessage?.contextInfo?.quotedMessage
                ?.imageMessage
                
            let thumbBuffer = null

            try {
                const thumbnailUrl = process.env.THUMBNAIL_URL
                const response = await axios.get(thumbnailUrl, {
                    responseType: "arraybuffer",
                })
                thumbBuffer = Buffer.from(response.data, "binary")
            } catch (error) {
                console.error("❌ error get thumbnail:", error)
            }
            
            const context = createAdReplyContext(thumbBuffer)

            if (!isImage) {
                try {
                    await sock.sendMessage(sender, { react: { text: "❌", key: msg.key } })
                    await sock.sendMessage(
                        sender,
                        {
                            text: `> *Kirimkeun gambar sia jeung caption atawa reply gambar anu antos di send ka WA ku panitah ieu:*\n\`\`\`\n.sticker\n.stiker\n.s\n\`\`\``,
                            contextInfo: context
                        },
                        { quoted: msg }
                    )
                } catch (err) {
                    console.error("❌ error:", err)
                }
                return
            }

            try {
                await sock.sendMessage(
                    sender,
                    {
                    text: "Keur proses yeuh blog...",
                    contextInfo: context,
                    },
                    { quoted: msg }
                )
                const targetMessage = msg.message.imageMessage
                    ? msg
                    : { message: msg.message.extendedTextMessage?.contextInfo?.quotedMessage }

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

                const stickerBuffer = await sticker.build()
                await sock.sendMessage(
                    sender,
                    { 
                        sticker: stickerBuffer,
                    },
                    { quoted: msg }
                )
                await sock.readMessages([msg.key])
                await sock.sendMessage(sender, { react: { text: "✅", key: msg.key } })

            } catch (error) {
                console.error("❌ error make sticker:", error)
                await sock.sendMessage(
                    sender, 
                    { 
                        text: "Botna moal baleg, gagal jieun stiker.",
                        contextInfo: context 
                    }, 
                    { quoted: msg }
                )
            }
            break
        }
    }
}