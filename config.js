export const PREFIX = "."

export const cooldowns = new Map()
const cdSec = 60
const delayMs = 1500

setInterval(() => {
    const now = Date.now()
    for (const [key, data] of cooldowns) {
        const duration = (data.duration || 60) * 1000
        const elapsed = now - (data.time || data)
        if (elapsed > duration) {
            cooldowns.delete(key)
        }
    }
}, 5 * 60 * 1000)

export const cdDelay = async (userJid, sender, sock, msg, keySuffix = '', customDuration = null) => {
    const cdKey = userJid + keySuffix
    const now = Date.now()
    if (cooldowns.has(cdKey)) {
        const cdData = cooldowns.get(cdKey)
        const lastCommandTime = cdData.time || cdData
        const hasWarned = cdData.warned || false
        
        const duration = customDuration || cdData.duration || 60
        
        const timePassed = (now - lastCommandTime) / 1000
        
        if (timePassed < duration) {
            if (!hasWarned) {
                const timeLeft = Math.ceil(duration - timePassed)
                const textMsg = duration >= 60 
                    ? `CD Stiker ${timeLeft} detik lagi` 
                    : `CD kirim petunjuk ${timeLeft} detik lagi`
                await sock.sendMessage(sender, { text: textMsg }, { quoted: msg })
                cooldowns.set(cdKey, { time: lastCommandTime, duration, warned: true })
            }
            return true // stop exec
        } else {
            cooldowns.delete(cdKey)
        }
    }

    await new Promise(res => setTimeout(res, delayMs))

    return false // continue exec
}
