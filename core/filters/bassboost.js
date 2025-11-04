module.exports = {
    name: 'bassboost',
    isEnabled(player) {
        return player.shoukaku?.filters?.equalizer?.some((band, idx) =>
            (idx === 0 && band.band === 0 && band.gain === 0.8) ||
            (idx === 1 && band.band === 1 && band.gain === 0.7)
        );
    },

    getConfig() {
        return {
            equalizer: [
                { band: 0, gain: 0.8 },
                { band: 1, gain: 0.7 },
                { band: 2, gain: 0.6 },
                { band: 3, gain: 0.3 },
                { band: 4, gain: 0.0 },
                { band: 5, gain: 0.0 },
                { band: 6, gain: 0.0 },
                { band: 7, gain: 0.0 },
                { band: 8, gain: 0.0 },
                { band: 9, gain: 0.0 }
            ],
            timescale: {
                speed: 1.0,
                pitch: 0.98,
                rate: 1.0
            }
        };
    },

    async toggle(player, channel) {
        try {
            const enabled = this.isEnabled(player);

            if (enabled) {
                await player.shoukaku.clearFilters();
                channel?.send('♬ **Bassboost:** DISABLED');
                return false;
            } else {
                const cfg = this.getConfig();
                await player.shoukaku.setFilters(cfg);
                channel?.send('♬ **Bassboost:** ENABLED');
                return true;
            }
        } catch (err) {
            console.error('[BASSBOOST] Error toggling filter:', err);
            channel?.send('❌ Failed to toggle bassboost filter.');
            throw err;
        }
    },

    async apply(player) {
        const cfg = this.getConfig();
        await player.shoukaku.setFilters(cfg);
    },

    async remove(player) {
        await player.shoukaku.clearFilters();
    }
};