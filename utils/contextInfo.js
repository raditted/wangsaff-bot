export const createAdReplyContext = (thumbBuffer) => {
    // ⚠️ externalAdReply dinonaktifkan — field ini hanya untuk WA Business API resmi.
    // Penggunaannya pada akun biasa melanggar ToS WA dan berisiko tinggi menyebabkan ban.
    // return {
    //     externalAdReply: {
    //         title: "- Saint-Chamond✨ -",
    //         body: "@raditted | made with ❤",
    //         mediaType: 1,
    //         renderLargerThumbnail: false,
    //         sourceUrl: "https://raditted.dev",
    //         thumbnail: thumbBuffer,
    //     },
    // }
    return {}
}