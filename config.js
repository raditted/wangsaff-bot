export const PREFIX = "."

export const cooldowns = new Map()
const cdSec = 60
const delayMs = 1500 // 1.5 s

export const cdDelay = async (sender, sock, msg) => {
    const now = Date.now()
    if (cooldowns.has(sender)) {
        const cdData = cooldowns.get(sender)
        const lastCommandTime = cdData.time || cdData
        const hasWarned = cdData.warned || false
        
        const timePassed = (now - lastCommandTime) / 1000
        
        if (timePassed < cdSec) {
            if (!hasWarned) {
                const timeLeft = Math.ceil(cdSec - timePassed)
                await sock.sendMessage(sender, { text: `Keheula any... CD ${timeLeft} detik deui. (CD 1 menit)` }, { quoted: msg })
                cooldowns.set(sender, { time: lastCommandTime, warned: true })
            }
            return true // stop exec
        }
    }

    await new Promise(res => setTimeout(res, delayMs))

    return false // continue exec
}
