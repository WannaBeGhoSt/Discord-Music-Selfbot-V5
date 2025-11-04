module.exports = {
    name: 'heaven',

    isEnabled(player) {
        const f = player.shoukaku?.filters;
        if (!f) return false;
        const timescaleMatch =
            f.timescale?.speed === 0.85 &&
            f.timescale?.pitch === 0.9;
        const rotationMatch = f.rotation?.rotationHz === 0.1;
        return timescaleMatch && rotationMatch;
    },

    getConfig() {
        return {
            timescale: {
                speed: 0.85,
                pitch: 0.9,
                rate: 1.0
            },
            rotation: {
                rotationHz: 0.1
            },
            channelMix: {
                leftToLeft: 0.85,
                leftToRight: 0.15,
                rightToRight: 0.85,
                rightToLeft: 0.15
            },
            equalizer: [
                { band: 0, gain: 0.15 },
                { band: 1, gain: 0.15 },
                { band: 9, gain: 0.2 }
            ],
            karaoke: {
                level: 0.25,
                monoLevel: 0.15,
                filterBand: 650.0,
                filterWidth: 125.0
            },
            lowPass: {
                smoothing: 1.6
            }
        };
    },

    async toggle(player, channel) {
        try {
            const enabled = this.isEnabled(player);

            if (enabled) {
                await player.shoukaku.clearFilters();
                try { await player.setVolume(100); } catch (e) {}
                channel?.send('♬ **Heaven:** DISABLED');
                return false;
            } else {
                const cfg = this.getConfig();
                await player.shoukaku.setFilters(cfg);
                const currentVol = player.volume || 100;
                try { await player.setVolume(Math.min(currentVol, 100)); } catch (e) {}
                channel?.send('♬ **Heaven:** ENABLED');
                return true;
            }
        } catch (err) {
            console.error('[HEAVEN] Error toggling filter:', err);
            channel?.send('❌ Failed to toggle Heaven filter.');
            throw err;
        }
    },

    async apply(player) {
        await player.shoukaku.setFilters(this.getConfig());
    },

    async remove(player) {
        await player.shoukaku.clearFilters();
    }
};