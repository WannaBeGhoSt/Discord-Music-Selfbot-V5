const linkHandler = require('../helpers/linkHandler');
const lofiFilter = require('../filters/lofi');
const clearFilter = require('../filters/clearfilters');
const bassBoost = require('../filters/bassboost');
const dolby = require('../filters/dolby');
const heaven = require('../filters/heaven');
const vibe = require('../filters/vibe');
const instrumental = require('../filters/instrumental');

class GhostyCommands {
    constructor(client, kazagumo, autoplayHandler, prefix) {
        this.client = client;
        this.kazagumo = kazagumo;
        this.autoplayHandler = autoplayHandler;
        this.prefix = prefix;
    }

    ghostyFormatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    ghostyCreateProgressBar(current, total, length = 20) {
        const percentage = current / total;
        const filled = Math.round(percentage * length);
        const empty = length - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    }

    async ghostyHandleCommand(message, command, query) {
        switch (command) {
            case 'help':
                return this.ghostyHelpCommand(message);
            case 'play':
            case 'p':
                return this.ghostyPlayCommand(message, query);
            case 'skip':
                return this.ghostySkipCommand(message);
            case 'stop':
            case 'disconnect':
            case 'dc':
                return this.ghostyStopCommand(message);
            case 'queue':
            case 'q':
                return this.ghostyQueueCommand(message);
            case 'nowplaying':
            case 'np':
                return this.ghostyNowPlayingCommand(message);
            case 'volume':
                return this.ghostyVolumeCommand(message, query);
            case 'autoplay':
                return this.ghostyAutoplayCommand(message);
            case 'lofi':
                return this.ghostyLofiCommand(message);
            case 'clearfilters':
            case 'cf':
            case 'cfs':
            case 'clearfilter':
                return this.ghostyClearFiltersCommand(message);
            case 'bassboost':
            case 'bass':
            case 'bb':
                return this.ghostyBassBoostCommand(message);
            case 'dolby':
            case 'cinema':
            case 'atmos':
            case 'cinematic':
            case 'surroundsound':
                return this.ghostyDolbyCommand(message);
            case 'heaven':
            case 'angelic':
            case 'divine':
                return this.ghostyHeavenCommand(message);
            case 'vibe':
            case 'atmosphere':
            case 'chill':
            case 'vibes':
                return this.ghostyVibeCommand(message);
            case 'instrumental':
            case 'vocalscut':
            case 'karaoke':
                return this.ghostyInstrumentalCommand(message);
        }
    }

    ghostyHelpCommand(message) {
        const helpMessage = `
🎵 **__GhoSty Music V5__** 🎶

**Playback & Control** [►│►■]
\`${this.prefix}play \` - Play a song
\`${this.prefix}skip\` - Skip track  
\`${this.prefix}stop\` - Stop & clear queue

**Player Info** [⥂⇩]
\`${this.prefix}queue\` - Show queue
\`${this.prefix}nowplaying\` - Current track info

**Settings & Filters** [♬↻♬]
\`${this.prefix}volume <0-1000>\` - Adjust volume
\`${this.prefix}autoplay\` - Toggle GhoSty AI recommendations
\`${this.prefix}Clearfilters\` - Clear audio filters
\`${this.prefix}lofi\`, \`bassboost\`, \`dolby\`, \`heaven\`, \`instrumental\`, \`vibe\` - Audio filters
`;
        return message.channel.send(helpMessage);
    }

    async ghostyPlayCommand(message, query) {
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) {
            return message.channel.send('You must be in a voice channel to use the play command.');
        }

        let player = this.kazagumo.players.get(message.guild.id);
        if (!player) {
            this.autoplayHandler.cleanupGuildState(message.guild.id);
            console.log(`[PLAY] Creating new player for guild ${message.guild.id}`);
            try {
                player = await this.kazagumo.createPlayer({
                    guildId: message.guild.id,
                    textId: message.channel.id,
                    voiceId: voiceChannel.id,
                    volume: 50,
                    deaf: true
                });
            
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error("Error creating player:", err);
                return message.channel.send(`Failed to join voice channel`);
            }
        } else if (player.voiceId !== voiceChannel.id) {
            player.setVoiceChannel(voiceChannel.id);
            message.channel.send(`▶️ **Moved:** Joined voice channel \`${voiceChannel.name}\`.`);
        }

        if (!query) {
            return message.channel.send('**Missing Query:** Please provide a song name or URL.');
        }

        
        const inputInfo = linkHandler.normalizeSearchInput(query);
        
        let searchResult;
        let searchQuery = inputInfo.value;

        try {
            
            if (inputInfo.type === 'url' && inputInfo.linkInfo?.type.includes('youtube')) {
                const videoId = linkHandler.extractVideoId(query);
                if (videoId) {
                    
                    searchResult = await this.kazagumo.search(`https://www.youtube.com/watch?v=${videoId}`, {
                        requester: message.author,
                        engine: 'youtube',
                    });

                    
                    if (!searchResult || searchResult.type === 'NO_MATCHES' || searchResult.tracks.length === 0) {
                        searchResult = await this.kazagumo.search(videoId, {
                            requester: message.author,
                            engine: 'youtube',
                        });
                    }

                    
                    if (!searchResult || searchResult.type === 'NO_MATCHES' || searchResult.tracks.length === 0) {
                        searchResult = await this.kazagumo.search(`ytsearch:${videoId}`, {
                            requester: message.author,
                            engine: 'youtube',
                        });
                    }
                } else {
                    return message.channel.send('Invalid YouTube URL format.');
                }
            } else {
                
                searchResult = await this.kazagumo.search(searchQuery, {
                    requester: message.author,
                    engine: 'youtube',
                });
            }
        } catch (err) {
            console.error("Lavalink search error:", err);
            return message.channel.send('Error while searching for the track.');
        }
        
        const { tracks, type, playlistName } = searchResult;

        if (type === 'NO_MATCHES' || !tracks.length) {
            return message.channel.send(`🔎 **No Results:**`);
        }

        if (type === 'PLAYLIST_LOADED') {
            
            tracks.forEach(track => {
                track.isAutoPlayed = false;
                player.queue.add(track);
                
            });
            message.channel.send(`🎶 **Added Playlist:** \`${playlistName}\` with ${tracks.length} tracks to the queue.`);
            
            if (tracks[0]) this.autoplayHandler.recordManualTrack(message.guild.id, tracks[0]);
            
            if (this.autoplayHandler.getAutoplayStatus(message.guild.id)) {
                this.autoplayHandler.prefetchForGuild(player).catch(err => console.error('[AUTOPLAY PREFETCH ERROR]', err));
            }
        } else {
            const track = tracks[0];
            track.isAutoPlayed = false;
            player.queue.add(track);
            this.autoplayHandler.recordManualTrack(message.guild.id, track);
        
        
            await new Promise(resolve => setTimeout(resolve, 500));
        
            message.channel.send(`🎵 **Queued:** \`${track.title}\` - Now at position \`${player.queue.length}\``);
        }

    
        if (!player.playing && !player.paused) {
            await player.play();
        
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentTrack = player.queue.current;
            if (currentTrack) {
                this.autoplayHandler.startTrackMonitor(player, currentTrack);
            }
        }
    }

    async ghostySkipCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player) {
            return message.channel.send('No active music player in this guild.');
        }

        if (!player.playing) {
            return message.channel.send('Nothing is currently playing.');
        }

        const currentTrack = player.queue.current;
        player.skip();
        
        message.channel.send(`|► **Skipped:** \`${currentTrack.title}\` by \`${currentTrack.author}\``);
        
        
        const nextTrack = player.queue.current;
        if (nextTrack) {
            this.autoplayHandler.startTrackMonitor(player, nextTrack);
        }
    }

    async ghostyStopCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (player) {
            console.log(`[STOP] Cleaning up and destroying player for guild ${message.guild.id}`);
            
            this.autoplayHandler.cleanupGuildState(message.guild.id);
            player.destroy();
            message.channel.send('⏹️ **Stop & Disconnect:** Cleared the queue and left the voice channel.');
        } else {
            message.channel.send('No active music player in this guild.');
        }
    }

    async ghostyQueueCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        const queue = player.queue;
        const currentTrack = queue.current;
        
        
        const isAutoPlayed = currentTrack.isAutoPlayed ? ' [↻ Auto]' : '';
        
        let queueMessage = `⥂ **Queue (${queue.length} tracks)**\n\n`;
        queueMessage += `**Currently Playing:**\n`;
        queueMessage += `1. \`${currentTrack.title}\` by \`${currentTrack.author}\` [\`${this.ghostyFormatTime(currentTrack.length)}\`]${isAutoPlayed}\n\n`;

        if (queue.length === 0) {
            queueMessage += `**Upcoming:** No tracks in queue.`;
        } else {
            queueMessage += `**Upcoming:**\n`;
            for (let i = 0; i < Math.min(10, queue.length); i++) {
                const track = queue[i];
                const trackAutoStatus = track.isAutoPlayed ? ' [↻]' : '';
                queueMessage += `${i + 2}. \`${track.title}\` by \`${track.author}\` [\`${this.ghostyFormatTime(track.length)}\`]${trackAutoStatus}\n`;
            }
            
            if (queue.length > 10) {
                queueMessage += `\n*...and ${queue.length - 10} more tracks*`;
            }
        }

        message.channel.send(queueMessage);
    }

    async ghostyNowPlayingCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        const track = player.queue.current;
        const current = player.position;
        const total = track.length;
        
        const progressBar = this.ghostyCreateProgressBar(current, total);
        const currentTime = this.ghostyFormatTime(current);
        const totalTime = this.ghostyFormatTime(total);

        const requesterText = track.requester?.id ? `<@${track.requester.id}>` : 'GhoSty AI V5';
        const autoPlayedText = track.isAutoPlayed ? '\n**Source:** Autoplay ↻' : '';

        const nowPlayingMessage = `
⇩ **Now Playing**

**Title:** \`${track.title}\`
**Author:** \`${track.author}\`
**Length:** \`${totalTime}\`${autoPlayedText}

${progressBar} ${currentTime} / ${totalTime}

**Requester:** ${requesterText}
**Queue Position:** \`${player.queue.length} tracks remaining\`
`;
        message.channel.send(nowPlayingMessage);
    }

    async ghostyVolumeCommand(message, query) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player) {
            return message.channel.send('No active music player in this guild.');
        }

        if (!query) {
            return message.channel.send(`📶 **Current Volume:** \`${player.volume}%\``);
        }

        const volume = parseInt(query);
        if (isNaN(volume) || volume < 0 || volume > 1000) {
            return message.channel.send('⚠️ Volume must be between 0 and 1000.');
        }

        player.setVolume(volume);
        message.channel.send(`📶 **Volume Set:** \`${volume}%\``);
    }

    async ghostyAutoplayCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }
 
        const guildId = message.guild.id;
        const currentStatus = this.autoplayHandler.getAutoplayStatus(guildId);
        const newStatus = !currentStatus;
 
        
        this.autoplayHandler.setAutoplayStatus(guildId, newStatus);
 
        const statusText = newStatus ? 'ENABLED' : 'DISABLED';
        message.channel.send(`↻ **Autoplay:** ${statusText}\n-# Powered by GhoSty AI V5 | Async Developement`);

        
        if (newStatus) {
            
            const currentTrack = player.queue.current;
            if (currentTrack && !currentTrack.isAutoPlayed) {
                this.autoplayHandler.recordManualTrack(guildId, currentTrack);
            }
            this.autoplayHandler.prefetchForGuild(player).catch(err => console.error('[AUTOPLAY PREFETCH ERROR]', err));
        } else {
            
            this.autoplayHandler.autoplayCache.delete(guildId);
        }
    }

    async ghostyLofiCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await lofiFilter.toggle(player, message.channel);
        } catch (err) {
            console.error('[LOFI] Error toggling filter:', err);
            message.channel.send('Failed to toggle lofi filter.');
        }
    }

    async ghostyClearFiltersCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await clearFilter.clear(player, message.channel);
        } catch (err) {
            console.error('[CLEARFILTERS] Error clearing filters:', err);
            message.channel.send('Failed to clear audio filters.');
        }
    }

    async ghostyBassBoostCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await bassBoost.toggle(player, message.channel);
        } catch (err) {
            console.error('[BASSBOOST] Error toggling filter:', err);
            message.channel.send('Failed to toggle bassboost filter.');
        }
    }

    async ghostyDolbyCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await dolby.toggle(player, message.channel);
        } catch (err) {
            console.error('[DOLBY] Error toggling filter:', err);
            message.channel.send('Failed to toggle Dolby filter.');
        }
    }

    async ghostyHeavenCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await heaven.toggle(player, message.channel);
        } catch (err) {
            console.error('[HEAVEN] Error toggling filter:', err);
            message.channel.send('Failed to toggle Heaven filter.');
        }
    }

    async ghostyVibeCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await vibe.toggle(player, message.channel);
        } catch (err) {
            console.error('[VIBE] Error toggling filter:', err);
            message.channel.send('Failed to toggle Vibe filter.');
        }
    }

    async ghostyInstrumentalCommand(message) {
        const player = this.kazagumo.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.channel.send('No active music player in this guild.');
        }

        try {
            await instrumental.toggle(player, message.channel);
        } catch (err) {
            console.error('[INSTRUMENTAL] Error toggling filter:', err);
            message.channel.send('Failed to toggle Instrumental filter.');
        }
    }

}

module.exports = GhostyCommands;