export const PREFIX = "."

export const cooldowns = new Map()
const cdSec = 5
const delayMs = 1500 // 1.5 s

export const cdDelay = async (sender, sock, msg) => {
    const now = Date.now()
    if (cooldowns.has(sender)) {
        const lastCommandTime = cooldowns.get(sender)
        const timePassed = (now - lastCommandTime) / 1000
        
        if (timePassed < cdSec) {
            const timeLeft = Math.ceil(cdSec - timePassed)
            await sock.sendMessage(sender, { text: `Keheula any... CD ${timeLeft} detik deui.` }, { quoted: msg })
            return true // stop exec
        }
    }

    await new Promise(res => setTimeout(res, delayMs))

    return false // continue exec
}
