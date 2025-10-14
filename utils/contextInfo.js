export const createAdReplyContext = (thumbBuffer) => {
    return {
        externalAdReply: {
            title: "- Saint-Chamond✨ -",
            body: "@raditted | made with ❤",
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: "https://raditted.dev",
            thumbnail: thumbBuffer,
        },
    };
};