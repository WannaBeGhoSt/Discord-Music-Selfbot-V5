module.exports = {
    name: 'instrumental',

    isEnabled(player) {
        const f = player.shoukaku?.filters;
        if (!f) return false;
        return f.karaoke?.level === 1.0 && f.karaoke?.monoLevel === 1.0;
    },

    getConfig() {
        return {
            karaoke: {
                level: 1.0,
                monoLevel: 1.0,
                filterBand: 220.0,
                filterWidth: 200.0
            }
        };
    },

    async toggle(player, channel) {
        try {
            const enabled = this.isEnabled(player);

            if (enabled) {
                await player.shoukaku.clearFilters();
                try { await player.setVolume(100); } catch (e) {}
                channel?.send('♬ **Instrumental/Karaoke:** DISABLED');
                return false;
            } else {
                const cfg = this.getConfig();
                await player.shoukaku.setFilters(cfg);
                const currentVol = player.volume || 100;
                try { await player.setVolume(Math.min(currentVol, 100)); } catch (e) {}
                channel?.send('♬ **Instrumental/Karaoke:** ENABLED');
                return true;
            }
        } catch (err) {
            console.error('[INSTRUMENTAL] Error toggling filter:', err);
            channel?.send('❌ Failed to toggle Instrumental filter.');
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