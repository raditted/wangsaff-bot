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

// Dummy HTTP Server agar Heroku tidak SIGKILL (Error R10)
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

const authFolder = join(__dirname, 'auth_info')

// Restore session from process.env.SESSION_DATA jif exists
const restoreSessionFromEnv = () => {
    if (process.env.SESSION_DATA) {
        try {
            if (!fs.existsSync(authFolder)) {
                fs.mkdirSync(authFolder, { recursive: true })
            }
            const filesObj = JSON.parse(Buffer.from(process.env.SESSION_DATA, 'base64').toString('utf-8'))
            for (const [filename, content] of Object.entries(filesObj)) {
                fs.writeFileSync(join(authFolder, filename), content)
            }
            console.log('✅ Session berhasil di-restore dari SESSION_DATA!')
        } catch (err) {
            console.error('❌ Gagal restore SESSION_DATA:', err.message)
        }
    }
}

// Generate string Base64 dari folder auth_info
const exportSessionToBase64 = () => {
    try {
        if (!fs.existsSync(authFolder)) return null
        const files = fs.readdirSync(authFolder)
        const filesObj = {}
        for (const file of files) {
            const filePath = join(authFolder, file)
            if (fs.statSync(filePath).isFile()) {
                filesObj[file] = fs.readFileSync(filePath, 'utf-8')
            }
        }
        return Buffer.from(JSON.stringify(filesObj)).toString('base64')
    } catch (err) {
        console.error('❌ Gagal export session ke Base64:', err.message)
        return null
    }
}

const startSock = async () => {
    restoreSessionFromEnv()

    const { state, saveCreds } = await useMultiFileAuthState(authFolder)
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
            const sessionBase64 = exportSessionToBase64()
            if (sessionBase64) {
                console.log('\n================ SESSION DATA (COPY) ================')
                console.log(sessionBase64)
                console.log('=========================================================\n')
            }
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
