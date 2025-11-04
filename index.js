const { Client } = require('discord.js-selfbot-v13');
const { Kazagumo } = require('kazagumo');
const { Shoukaku, Connectors } = require('shoukaku');
const AutoplayHandler = require('./core/helpers/autoplayHandler');                                                                                                                                                 // made by ghosty
const GhostyCommands = require('./core/heart/commands');

// ---------------------------------------CONFIG------------------------------------------ 

const ACCOUNTTOKEN = 'YOUR_TOKEN_HERE'; // Replace with your Discord account token
const PREFIX = '?'; // Replace with your desired command prefix

const NODES = [{ // Public Lavalink Node. This is not mine, you can use your own Lavalink node if you have one. But it works fine.
    name: 'GhoSty Public Node',
    url: 'lava-all.ajieblogs.eu.org:80',
    auth: 'https://dsc.gg/ajidevserver',
    secure: false
}];

// ---------------------------------------CONFIG------------------------------------------

const client = new Client({
    checkUpdate: false,
});

const kazagumo = new Kazagumo({
        defaultSearchEngine: 'youtube',
        send: (guildId, payload) => {
            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        }
    },
    new Connectors.DiscordJS(client),
    NODES
);

const autoplayHandler = new AutoplayHandler(kazagumo, client);
const ghostyCommands = new GhostyCommands(client, kazagumo, autoplayHandler, PREFIX);                                                                                                                                                 // made by ghosty

client.on('ready', async () => {
    console.log(`[CLIENT] GhoSty Music V5 Ready As: ${client.user.tag}`);
    autoplayHandler.startGlobalMonitor();
});

kazagumo.shoukaku.on('ready', name => {
    console.log(`[LAVALINK] Node ${name}: Ready!`);
});

kazagumo.shoukaku.on('error', (name, error) => {
    console.error(`[LAVALINK] Node ${name}: Error -`, error);
});                                                                                                                                                // made by ghosty

kazagumo.shoukaku.on('close', (name, code, reason) => {
    console.warn(`[LAVALINK] Node ${name}: Closed. Code ${code}, Reason: ${reason || 'No reason'}`);
});

kazagumo.on('playerStart', (player, track) => {
    autoplayHandler.startTrackMonitor(player, track);
    client.channels.cache.get(player.textId)?.send(`🔊 **Now Playing:** \`${track.title}\` by \`${track.author}\``);
});

kazagumo.on('playerEnd', async (player) => {
    
    if (player.queue.length === 0 && autoplayHandler.getAutoplayStatus(player.guildId)) {
        try {
            const lastTrack = player.queue.previous[0] || player.queue.current;
            if (lastTrack) {
                await autoplayHandler.enableAutoplay(player);
            }
        } catch (err) {
            console.error('[PLAYEREND AUTOPLAY ERROR]', err);
        }
    } else if (player.queue.length === 0) {
        player.destroy();
        client.channels.cache.get(player.textId)?.send('⏹️ Queue finished. Disconnecting from voice channel.');                                                                                                                                                // made by ghosty
    }
});

kazagumo.on('playerDestroy', (player) => {
    console.log(`[PLAYER] Destroyed in guild ${player.guildId}`);
    autoplayHandler.cleanupGuildState(player.guildId);
});

kazagumo.on('playerStuck', (player, data) => {                                                                                                                                                // made by ghosty
    console.warn(`[PLAYER] Stuck in guild ${player.guildId}:`, data);
    
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
        channel.send('**Player Stuck:** Attempting to skip...');
    }
    
    player.skip();
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);                                                                                                                                                 // made by ghosty
    const command = args.shift().toLowerCase();
    const query = args.join(' ');

    await ghostyCommands.ghostyHandleCommand(message, command, query);
});

client.login(ACCOUNTTOKEN).catch(err => {
    console.error("Failed to log in. Ensure your token is correct.", err);                                                                                                                                                 // made by ghosty
});