module.exports = {
    name: 'dolby',

    isEnabled(player) {
        const f = player.shoukaku?.filters;
        if (!f) return false;
        const rotationMatch = f.rotation?.rotationHz === 0.22;
        const channelMixMatch = f.channelMix &&
            f.channelMix.leftToLeft === 0.8 &&
            f.channelMix.leftToRight === 0.2 &&
            f.channelMix.rightToRight === 0.8 &&
            f.channelMix.rightToLeft === 0.2;
        return rotationMatch && channelMixMatch;
    },

    getConfig() {
        return {
            rotation: { rotationHz: 0.22 },
            channelMix: {
                leftToLeft: 0.8,
                leftToRight: 0.2,
                rightToRight: 0.8,
                rightToLeft: 0.2
            },
            equalizer: [
                { band: 0, gain: 0.15 },
                { band: 1, gain: 0.1 },
                { band: 9, gain: 0.2 }
            ],
            lowPass: { smoothing: 1.4 },
            karaoke: {
                level: 0.12,
                monoLevel: 0.08,
                filterBand: 800.0,
                filterWidth: 150.0
            }
        };
    },

    async toggle(player, channel) {
        try {
            const enabled = this.isEnabled(player);

            if (enabled) {
                await player.shoukaku.clearFilters();
                try { await player.setVolume(100); } catch (e) {}
                channel?.send('♬ **Dolby Surround Sound:** DISABLED');
                return false;
            } else {
                const cfg = this.getConfig();
                await player.shoukaku.setFilters(cfg);
                const currentVol = player.volume || 100;
                try { await player.setVolume(Math.min(currentVol, 100)); } catch (e) {}
                channel?.send('♬ **Dolby Surround Sound:** ENABLED');
                return true;
            }
        } catch (err) {
            console.error('[DOLBY] Error toggling filter:', err);
            channel?.send('❌ Failed to toggle Dolby filter.');
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