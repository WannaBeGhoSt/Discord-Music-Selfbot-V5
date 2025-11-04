const axios = require('axios');

class AutoplayHandler {
    constructor(kazagumo, client) {
        this.kazagumo = kazagumo;
        this.client = client;
        this.autoplayLocks = new Map();
        this.autoplayHistory = new Map();
        this.autoplayStatus = new Map();
        this.activeTrackMonitors = new Map();
        this.lastKnownStates = new Map();
        this.autoplayCache = new Map(); 
        this.manualSeeds = new Map();   
    }

    cleanupGuildState(guildId) {
        this.setAutoplayStatus(guildId, false);
        this.autoplayCache.delete(guildId);
        this.stopTrackMonitor(guildId);
        this.manualSeeds.delete(guildId);
        this.autoplayHistory.delete(guildId);
        this.lastKnownStates.delete(guildId);
        this.autoplayLocks.delete(guildId);
    }

    
    isPlayerValid(player) {
        if (!player || player.destroyed) return false;
        const exists = this.kazagumo.players.has(player.guildId);
        const autoplayEnabled = this.getAutoplayStatus(player.guildId);
        return exists && autoplayEnabled;
    }


    startGlobalMonitor() {
        console.log('[SYSTEM] Starting global player monitor');

        setInterval(() => {
            try {
                const players = this.kazagumo.players;
                if (!players?.size) return;

                players.forEach((player, guildId) => {
                    this.checkPlayerState(player, guildId);
                });
            } catch (err) {
                console.error('[MONITOR ERROR]', err);
            }
        }, 2000);
    }

    recordManualTrack(guildId, track) {
        if (!track || !track.identifier) return;
        if (track.isAutoPlayed) return;

        const seeds = this.manualSeeds.get(guildId) || { initial: null, recent: [] };

        
        if (!seeds.initial) {
            seeds.initial = track.identifier;
        } else if (seeds.initial === track.identifier) {
            
        } else {
            
            seeds.recent = [track.identifier, ...seeds.recent.filter(id => id !== track.identifier && id !== seeds.initial)];
            if (seeds.recent.length > 2) seeds.recent.length = 2;
        }

        this.manualSeeds.set(guildId, seeds);
    }

    getSeedIds(guildId) {
        const seeds = this.manualSeeds.get(guildId) || { initial: null, recent: [] };
        const ids = [];
        if (seeds.initial) ids.push(seeds.initial);
        for (const id of seeds.recent) {
            if (ids.length >= 3) break;
            if (!ids.includes(id)) ids.push(id);
        }
        return ids;
    }

    
    async prefetchForGuild(player, desiredCacheSize = 6) {
        if (!player) return;
        const guildId = player.guildId;
        if (!this.autoplayStatus.get(guildId)) return;
        if (!this.isPlayerValid(player)) return;

        const playedHistory = new Set();
        (this.autoplayHistory.get(guildId) || []).forEach(id => playedHistory.add(id));
        
        player.queue.previous?.forEach(t => t?.identifier && playedHistory.add(t.identifier));
        player.queue.tracks?.forEach(t => t?.identifier && playedHistory.add(t.identifier));

        const seedIds = this.getSeedIds(guildId);
        if (!seedIds.length) return;

        const cache = this.autoplayCache.get(guildId) || [];

        
        if (cache.length >= desiredCacheSize) {
            this.autoplayCache.set(guildId, cache);
            return;
        }

        for (let i = 0; i < seedIds.length && cache.length < desiredCacheSize; i++) {
            const seedId = seedIds[i];
            
            const cap = i === 0 ? 10 : 5;
            try {
                const recs = await this.fetchAutoplayRecommendations(seedId, cap);
                for (const rec of recs) {
                    if (cache.length >= desiredCacheSize) break;
                    if (!rec?.url || !rec.identifier) continue;
                    if (playedHistory.has(rec.identifier)) continue;
                    
                    if (cache.some(t => t.identifier === rec.identifier)) continue;

                    try {
                        const found = await player.search(rec.url).catch(() => null);
                        const foundTrack = found?.tracks?.[0];
                        if (foundTrack) {
                            
                            foundTrack.isAutoPlayed = true;
                            cache.push(foundTrack);
                            
                            playedHistory.add(foundTrack.identifier);
                        }
                    } catch (err) {
                        
                    }
                    
                    await new Promise(r => setTimeout(r, 120));
                }
            } catch (err) {
                console.error('[AUTOPLAY PREFETCH] Error fetching for seed', seedId, err?.message || err);
            }
        }

        this.autoplayCache.set(guildId, cache);
    }

    checkPlayerState(player, guildId) {
        if (!player || !guildId) return;

        const currentTrack = player.queue.current;
        const isPlaying = player.playing;
        const queueSize = player.queue.length;

        const lastState = this.lastKnownStates.get(guildId) || {};
        const newState = {
            trackId: currentTrack?.identifier,
            isPlaying,
            queueSize,
            position: player.position,
            lastUpdate: Date.now()
        };

        if (!lastState.trackId) {
            this.lastKnownStates.set(guildId, newState);
            return;
        }

        if (lastState.isPlaying && !newState.isPlaying && newState.queueSize === 0) {
            if (this.autoplayStatus.get(guildId) && currentTrack?.identifier) {
                this.enableAutoplay(player).catch(err => {
                    console.error('[MONITOR AUTOPLAY ERROR]', err);
                });
            }
        }

        this.lastKnownStates.set(guildId, newState);
    }

    startTrackMonitor(player, track) {
        if (!player || !track?.identifier) return;

        const guildId = player.guildId;
        this.stopTrackMonitor(guildId);


        const timeToEnd = Math.max(1000, track.length - 10000);

        const monitorId = setTimeout(() => {

            const endCheckInterval = setInterval(() => {
                const currentPlayer = this.kazagumo.players.get(guildId);
                if (!currentPlayer) {
                    clearInterval(endCheckInterval);
                    return;
                }

                const currentTrack = currentPlayer.queue.current;
                if (!currentPlayer.playing || currentTrack?.identifier !== track.identifier) {
                    clearInterval(endCheckInterval);

                    if (this.autoplayStatus.get(guildId) && currentPlayer.queue.length === 0) {
                        this.enableAutoplay(currentPlayer).catch(err => {
                            console.error('[TRACK MONITOR AUTOPLAY ERROR]', err);
                        });
                    }
                }
            }, 500);

            this.activeTrackMonitors.set(guildId, endCheckInterval);
        }, timeToEnd);

        this.activeTrackMonitors.set(guildId, monitorId);
    }

    stopTrackMonitor(guildId) {
        const monitorId = this.activeTrackMonitors.get(guildId);
        if (monitorId) {
            clearTimeout(monitorId);
            clearInterval(monitorId);
            this.activeTrackMonitors.delete(guildId);
        }
    }

    async fetchAutoplayRecommendations(videoId, cap = 7) {
        if (!videoId) {
            console.log('[AUTOPLAY] No video ID provided');
            return [];
        }

        const autoplayUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        };

        try {
            const res = await axios.get(autoplayUrl, { headers, timeout: 8000 });
            const match = res.data.match(/ytInitialData\s*=\s*(\{.*?\});/s);

            if (!match) {
                console.log('[AUTOPLAY] Could not parse YouTube data');
                return [];
            }

            const ytData = JSON.parse(match[1]);
            const playlistItems = ytData?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents || [];

            const trackPool = [];

            for (const item of playlistItems) {
                if (trackPool.length >= cap) break;

                const v = item.playlistPanelVideoRenderer;
                if (!v || !v.videoId || v.videoId === videoId) continue;

                const title = v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown';
                trackPool.push({
                    title,
                    identifier: v.videoId,
                    url: `https://www.youtube.com/watch?v=${v.videoId}`
                });
            }
            return trackPool;
        } catch (err) {
            console.error('[AUTOPLAY RD FETCH] Error:', err?.message || err);
            return [];
        }
    }

    async enableAutoplay(player) {
        const guildId = player.guildId;

        if (this.autoplayLocks.get(guildId)) {
            return;
        }

        this.autoplayLocks.set(guildId, true);

        try {
            if (!this.isPlayerValid(player)) {
                console.log(`[AUTOPLAY] Player invalid or destroyed in guild ${guildId}`);
                this.autoplayLocks.delete(guildId);
                return;
            }

            
            const currentTrack = player.queue.current;
            if (currentTrack && !currentTrack.isAutoPlayed) {
                this.recordManualTrack(guildId, currentTrack);
            }

            
            
  
            if (!currentTrack?.identifier) {
                console.log(`[AUTOPLAY] No seed track available in guild ${guildId}`);
                this.autoplayLocks.delete(guildId);
                return;
            }

            const playedTracks = new Set();
            const history = this.autoplayHistory.get(guildId) || [];

            if (currentTrack.identifier) playedTracks.add(currentTrack.identifier);
            if (currentTrack.uri) playedTracks.add(currentTrack.uri);
            if (currentTrack.title) playedTracks.add(currentTrack.title.toLowerCase());

            if (player.queue.previous) {
                player.queue.previous.slice(0, 30).forEach(track => {
                    if (track.identifier) playedTracks.add(track.identifier);
                    if (track.uri) playedTracks.add(track.uri);
                    if (track.title) playedTracks.add(track.title.toLowerCase());
                });
            }

            if (player.queue.tracks) {
                player.queue.tracks.forEach(track => {
                    if (track.identifier) playedTracks.add(track.identifier);
                    if (track.uri) playedTracks.add(track.uri);
                    if (track.title) playedTracks.add(track.title.toLowerCase());
                });
            }

            history.forEach(id => playedTracks.add(id));

            
            let selectedTrack = null;
            const cache = this.autoplayCache.get(guildId) || [];
            while (cache.length > 0 && !selectedTrack) {
                const candidate = cache.shift();
                
                if (!candidate || !candidate.identifier) continue;
                if (playedTracks.has(candidate.identifier)) continue;
                selectedTrack = candidate;
            }
            
            this.autoplayCache.set(guildId, cache);

            if (!selectedTrack) {
                const seedList = await this.fetchAutoplayRecommendations(currentTrack.identifier, 10);

                if (seedList.length > 0) {
                    const seedMap = new Map(seedList.map(t => [t.identifier, t]));
                    const countMap = new Map();

                    for (const id of seedMap.keys()) countMap.set(id, 2);

                    const prevTracks = player.queue.previous?.slice(0, 5) || [];
                    for (const track of prevTracks) {
                        if (track?.identifier && track.identifier !== currentTrack.identifier) {
                            const relatedList = await this.fetchAutoplayRecommendations(track.identifier, 5);
                            for (const t of relatedList) {
                                countMap.set(t.identifier, (countMap.get(t.identifier) || 0) + 1);
                            }
                            await new Promise(r => setTimeout(r, 100));
                        }
                    }

                    const weightedPool = [...countMap.entries()]
                        .filter(([id]) =>
                            id !== currentTrack.identifier &&
                            !playedTracks.has(id) &&
                            seedMap.has(id)
                        )
                        .sort((a, b) => b[1] - a[1])
                        .map(([id]) => seedMap.get(id));

                    const finalPool = weightedPool.length >= 3 ? weightedPool : seedList;

                    for (let i = finalPool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [finalPool[i], finalPool[j]] = [finalPool[j], finalPool[i]];
                    }

                    for (const rec of finalPool) {
                        if (!rec?.url) continue;
                        try {
                            const found = await player.search(rec.url);
                            if (found?.tracks?.[0]) {
                                selectedTrack = found.tracks[0];
                                break;
                            }
                        } catch (err) {
                            console.error(`[AUTOPLAY SEARCH] Failed for ${rec?.url}:`, err?.message || err);
                        }
                    }
                }
            }

            if (!selectedTrack) {

                const fallbackQueries = [
                    `songs by ${currentTrack.author}`,
                    `similar to ${currentTrack.title}`
                ];

                let foundTracks = [];

                for (const query of fallbackQueries) {
                    if (selectedTrack || foundTracks.length >= 5) break;


                    try {
                        const result = await this.kazagumo.search(query, {
                            requester: currentTrack.requester || { id: 'autoplay' },
                            engine: 'youtube'
                        });

                        if (result.tracks && result.tracks.length > 0) {
                            const filtered = result.tracks.filter(track =>
                                !playedTracks.has(track.identifier) &&
                                !playedTracks.has(track.uri) &&
                                !playedTracks.has(track.title?.toLowerCase())
                            );

                            foundTracks.push(...filtered.slice(0, 3));
                        }
                    } catch (err) {
                        console.error(`[AUTOPLAY QUERY] Error:`, err?.message || err);
                    }

                    await new Promise(r => setTimeout(r, 200));
                }

                if (foundTracks.length > 0) {
                    selectedTrack = foundTracks[0];
                }
            }

            if (selectedTrack) {
                if (!this.isPlayerValid(player)) {
                    return;
                }

                
                selectedTrack.isAutoPlayed = true;
                player.queue.add(selectedTrack);

                history.push(selectedTrack.identifier);
                if (history.length > 50) history.shift();
                this.autoplayHistory.set(guildId, history);

                if (!this.isPlayerValid(player)) {
                    return;
                }

                if (!player.playing && !player.paused && !player.destroyed) {
                    await player.play();
                }

                const channel = this.client.channels.cache.get(player.textId);
                if (channel) {
                    const msg = `↻ **Autoplay:** Now queuing \`${selectedTrack.title}\` by \`${selectedTrack.author}\``;
                    channel.send(msg);
                }

                
                setImmediate(() => this.prefetchForGuild(player).catch(() => {}));
            } else {
                player.destroy();
                this.client.channels.cache.get(player.textId)?.send('⏹️ No similar tracks found. Disconnecting.');
            }
        } catch (error) {
            console.error(`[AUTOPLAY] Fatal error in guild ${guildId}:`, error);
            this.cleanupGuildState(guildId);
        } finally {
            setTimeout(() => {
                this.autoplayLocks.delete(guildId);
            }, 5000);
        }
    }


    getAutoplayStatus(guildId) {
        return this.autoplayStatus.get(guildId) || false;
    }

    setAutoplayStatus(guildId, status) {
        this.autoplayStatus.set(guildId, status);
    }
}

module.exports = AutoplayHandler;