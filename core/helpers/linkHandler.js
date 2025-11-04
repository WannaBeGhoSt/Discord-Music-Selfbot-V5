function extractVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        const youtubeShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (youtubeShort) return youtubeShort[1];
        const youtubeRegex = /(?:youtube\.com|music\.youtube\.com)\/watch\?v=([a-zA-Z0-9_-]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch) return youtubeMatch[1];
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v');
        if (videoId && videoId.length === 11) return videoId;
        return null;
    } catch (err) {
        console.error('[LINK HANDLER] Error extracting video ID:', err.message);
        return null;
    }
}

function extractPlaylistId(url) {
    if (!url || typeof url !== 'string') return null;

    try {
        const urlObj = new URL(url);
        const playlistId = urlObj.searchParams.get('list');
        return playlistId || null;
    } catch (err) {
        console.error('[LINK HANDLER] Error extracting playlist ID:', err.message);
        return null;
    }
}

function isYouTubeLink(input) {
    if (!input || typeof input !== 'string') return false;

    const youtubePatterns = [
        /youtube\.com/,
        /youtu\.be/,
        /music\.youtube\.com/,
        /youtube\.com\/playlist/
    ];

    return youtubePatterns.some(pattern => pattern.test(input));
}

function isUrl(input) {
    if (!input || typeof input !== 'string') return false;

    try {
        new URL(input);
        return true;
    } catch {
        return false;
    }
}

function getLinkType(url) {
    if (!url || typeof url !== 'string') return null;

    if (/music\.youtube\.com/.test(url)) {
        return {
            type: 'youtube_music',
            isPlaylist: !!extractPlaylistId(url),
            videoId: extractVideoId(url),
            playlistId: extractPlaylistId(url)
        };
    }

    if (/youtube\.com\/playlist/.test(url)) {
        return {
            type: 'youtube_playlist',
            isPlaylist: true,
            videoId: null,
            playlistId: extractPlaylistId(url)
        };
    }

    if (/youtube\.com|youtu\.be/.test(url)) {
        return {
            type: 'youtube_video',
            isPlaylist: !!extractPlaylistId(url),
            videoId: extractVideoId(url),
            playlistId: extractPlaylistId(url)
        };
    }

    return {
        type: 'unknown',
        isPlaylist: false,
        videoId: null,
        playlistId: null
    };
}

function normalizeSearchInput(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (isUrl(trimmed)) {
        if (isYouTubeLink(trimmed)) {
            return {
                type: 'url',
                value: trimmed,
                linkInfo: getLinkType(trimmed)
            };
        }
        return {
            type: 'url',
            value: trimmed,
            linkInfo: null
        };
    }
    return {
        type: 'query',
        value: trimmed,
        linkInfo: null
    };
}

module.exports = {
    extractVideoId,
    extractPlaylistId,
    isYouTubeLink,
    isUrl,
    getLinkType,
    normalizeSearchInput
};