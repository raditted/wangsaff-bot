import * as baileys from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import fs from 'fs'
import http from 'http'
import { messagesHandler } from './handler.js'

config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Bot WA Active!')
}).listen(PORT, () => {
    console.log(`Web server active on port ${PORT}`)
})

const {
    makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
} = baileys

const delay = ms => new Promise(res => setTimeout(res, ms))

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(join(__dirname, 'auth_info'))
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: false,
        logger: pino({ level: 'silent' }),
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('❌ Connection closed. Reconnect:', shouldReconnect)
            if (shouldReconnect) startSock()
        } else if (connection === 'open') {
            console.log('✅ Bot connected!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages || messages.length === 0) return
        await messagesHandler(messages, sock)
    })

    await delay(2000)

    if (!sock.authState.creds?.registered) {
        const phoneNumber = process.env.PHONE_NUMBER
        if (!phoneNumber) {
            console.error('❌ PHONE_NUMBER not found in .env')
            process.exit(1)
        }

        try {
            const code = await sock.requestPairingCode(phoneNumber)
            console.log(`🔑 Pairing code: ${code}`)
            console.log(`👉 Buka WhatsApp > Linked Devices > "Link a device" > "Link with phone number instead"\nℹ️ Atau bisa juga buka lewat pesan notifikasi dari WhatsApp`)
        } catch (err) {
            console.error('❌ Gagal request pairing code:', err.message)
        }
    }
}

startSock()