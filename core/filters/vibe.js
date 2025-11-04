module.exports = {
    name: 'vibe',
    isEnabled(player) {
        const f = player.shoukaku?.filters;
        if (!f) return false;
        const rotationMatch = f.rotation?.rotationHz === 0.15;
        const tremoloMatch = f.tremolo &&
            f.tremolo.frequency === 3.5 &&
            f.tremolo.depth === 0.3;
        return rotationMatch && tremoloMatch;
    },

    getConfig() {
        return {
            rotation: { rotationHz: 0.15 },
            tremolo: {
                frequency: 3.5,
                depth: 0.3
            },
            lowPass: { smoothing: 2.0 },
            equalizer: [
                { band: 0, gain: 0.2 },
                { band: 1, gain: 0.15 },
                { band: 2, gain: 0.1 },
                { band: 3, gain: 0.25 },
                { band: 4, gain: 0.3 },
                { band: 5, gain: 0.2 },
                { band: 6, gain: 0.1 },
                { band: 7, gain: -0.1 },
                { band: 8, gain: -0.2 },
                { band: 9, gain: -0.3 }
            ],
            channelMix: {
                leftToLeft: 0.85,
                leftToRight: 0.15,
                rightToRight: 0.85,
                rightToLeft: 0.15
            }
        };
    },

    async toggle(player, channel) {
        try {
            const enabled = this.isEnabled(player);

            if (enabled) {
                await player.shoukaku.clearFilters();
                try { await player.setVolume(100); } catch (e) {}
                channel?.send('♬ **Vibe:** DISABLED');
                return false;
            } else {
                const cfg = this.getConfig();
                await player.shoukaku.setFilters(cfg);
                const currentVol = player.volume || 100;
                try { await player.setVolume(Math.min(currentVol, 100)); } catch (e) {}
                channel?.send('♬ **Vibe:** ENABLED');
                return true;
            }
        } catch (err) {
            console.error('[VIBE] Error toggling filter:', err);
            channel?.send('❌ Failed to toggle Vibe filter.');
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