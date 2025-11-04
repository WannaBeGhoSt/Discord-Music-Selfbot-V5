

module.exports = {
    name: 'lofi',
    
    
    isEnabled(player) {
        return player.shoukaku?.filters?.equalizer?.some(band =>
            band.band === 0 && band.gain === 0.25
        );
    },

    getConfig() {
        return {
            timescale: {
                speed: 0.8,
                pitch: 0.8,
                rate: 1.0
            },
            equalizer: [
                { band: 0, gain: 0.25 },
                { band: 1, gain: 0.15 },
                { band: 2, gain: 0.05 },
                { band: 3, gain: -0.05 },
                { band: 4, gain: -0.1 },
                { band: 5, gain: -0.1 },
                { band: 6, gain: -0.05 },
                { band: 7, gain: 0.0 },
                { band: 8, gain: 0.0 },
                { band: 9, gain: 0.0 },
                { band: 10, gain: -0.05 },
                { band: 11, gain: -0.1 },
                { band: 12, gain: -0.1 },
                { band: 13, gain: -0.15 },
                { band: 14, gain: -0.2 }
            ],
            lowPass: {
                smoothing: 1.5
            }
        };
    },

    async toggle(player, channel) {
        try {
            const isEnabled = this.isEnabled(player);

            if (isEnabled) {
                await player.shoukaku.clearFilters();
                channel?.send('♬ **Lofi:** DISABLED');
                return false;
            } else {
                const config = this.getConfig();
                await player.shoukaku.setFilters(config);
                channel?.send('♬ **Lofi:** ENABLED');
                return true;
            }
        } catch (err) {
            console.error('[LOFI FILTER] Error toggling filter:', err);
            channel?.send('❌Failed to toggle lofi filter.');
            throw err;
        }
    },

    
    async apply(player) {
        const config = this.getConfig();
        await player.shoukaku.setFilters(config);
    },

    
    async remove(player) {
        await player.shoukaku.clearFilters();
    }
};