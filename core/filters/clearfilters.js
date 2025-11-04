
module.exports = {
  name: 'clearfilters',
  aliases: ['cf', 'cfs', 'clearfilter'],

  isEnabled(player) {
    const f = player?.shoukaku?.filters;
    if (!f) return false;

    const eq = Array.isArray(f.equalizer) && f.equalizer.length > 0;
    const timescaleActive = !!(f.timescale && (
      (typeof f.timescale.speed === 'number' && f.timescale.speed !== 1) ||
      (typeof f.timescale.pitch === 'number' && f.timescale.pitch !== 1) ||
      (typeof f.timescale.rate === 'number' && f.timescale.rate !== 1)
    ));
    const lowPass = !!f.lowPass;
    const other = Object.keys(f).length > 0;

    return eq || timescaleActive || lowPass || other;
  },

  async clear(player, channel) {
    try {
      if (!player) {
        if (channel) channel.send('❌ No player available.');
        return false;
      }

      const dynamicFilters = ['neuralInterval', 'fractalInterval', 'unconsciousInterval'];
      if (player.data && typeof player.data.get === 'function') {
        dynamicFilters.forEach(name => {
          const iv = player.data.get(name);
          if (iv) {
            try { clearInterval(iv); } catch (e) {}
            player.data.delete(name);
          }
        });
      }

      if (player.shoukaku && typeof player.shoukaku.clearFilters === 'function') {
        await player.shoukaku.clearFilters();
      }

      if (typeof player.setVolume === 'function') {
        try { await player.setVolume(100); } catch (e) {}
      }

      if (channel) channel.send('✅ All audio filters cleared.');
      return true;
    } catch (err) {
      console.error('[CLEARFILTERS] Error clearing filters:', err);
      if (channel) channel.send('❌ Failed to clear audio filters.');
      throw err;
    }
  },

  async toggle(player, channel) {
    if (!this.isEnabled(player)) {
      if (channel) channel.send('ℹ️ No audio filters are active.');
      return false;
    }
    return this.clear(player, channel);
  },

  async execute(player, channel) {
    return this.clear(player, channel);
  }
};
