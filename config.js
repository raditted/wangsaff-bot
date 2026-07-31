export const PREFIX = "."

export const cooldowns = new Map()
const cdSec = 60
const delayMs = 1500 // 1.5 s

export const cdDelay = async (userJid, sender, sock, msg) => {
    const now = Date.now()
    if (cooldowns.has(userJid)) {
        const cdData = cooldowns.get(userJid)
        const lastCommandTime = cdData.time || cdData
        const hasWarned = cdData.warned || false
        
        const duration = cdData.duration || 60
        
        const timePassed = (now - lastCommandTime) / 1000
        
        if (timePassed < duration) {
            if (!hasWarned) {
                const timeLeft = Math.ceil(duration - timePassed)
                const textMsg = duration === 60 
                    ? `CD Stiker ${timeLeft} detik lagi` 
                    : `CD kirim petunjuk ${timeLeft} detik lagi`
                await sock.sendMessage(sender, { text: textMsg }, { quoted: msg })
                cooldowns.set(userJid, { time: lastCommandTime, duration, warned: true })
            }
            return true // stop exec
        }
    }
2
    await new Promise(res => setTimeout(res, delayMs))

    return false // continue exec
}
