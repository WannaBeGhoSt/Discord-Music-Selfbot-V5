# GhoSty Music SelfBot v5

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Discord.js SelfBot](https://img.shields.io/badge/Discord.js%20SelfBot-v13-blue.svg)](https://github.com/discordjs-selfbot/discord.js-selfbot-v13)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🎵 **Advanced Discord Music SelfBot** - A fluid and reliable music selfbot code in JS using Lavalink - Shoukaku with Kazagumo. Experience seamless music playback with advanced features and Smart AI Autoplay system.

## ⚠️ Important Disclaimer
**Note: Selfbots violate Discord's Terms of Service. Use at your own risk. This project is for educational purposes only. The developers are not responsible for any account termination or other consequences resulting from using this code.**

## 🚀 Features

### 🎵 Core Music Features
- **YouTube Integration**: Direct playback from YouTube with high-quality audio
- **Smart Search**: Intelligent song searching with query and links support
- **Similar Songs**: Discover and play music similar to current tracks
- **Now Playing**: Beautiful real-time track information display
- **AI AutoPlay Recommendations**: AI recommendations as per your music taste

### 🔧 Technical Features
- **Lightweight**: Optimized for performance with minimal resource usage
- **Easy Setup**: Simple configuration and installation process
- **Cross-Platform**: Works on Windows, macOS, Linux, and even mobile via Termux
- **Auto-Dependency Installation**: Automatic package management

### 🎯 Exclusive Features 
- **AI-Powered AutoPlay**: Intelligent music recommendation system
- **Playlist Support**: Play and manage your favorite playlists from any platform
- **Audio Effects**: Bass boost, equalizer, and sound enhancements
- **Multi-Platform Support**: SoundCloud, Spotify, and more sources (If your lavalink node supports)

## 📦 Installation Guide

### Prerequisites
- Node.js 16.0 or higher
- npm (Node Package Manager)
- Discord Account
- YouTube Access

### Step-by-Step Installation

#### For Windows/macOS/Linux:
```bash
# Clone or download the repository
cd repo

# Install dependencies
npm start or node index.js

# Configure your token
# Edit index.js and replace 'YOUR_TOKEN_HERE' with your Discord token

# Run the selfbot
npm start or node index.js
```

#### For Termux (Android):
```bash
# Update packages
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs

# Install required packages
npm install 
# Run the selfbot
npm start or node index.js
```

### Configuration
1. Open `index.js` in a text editor
2. Find line with `const token = 'YOUR_TOKEN_HERE';`
3. Replace `YOUR_TOKEN_HERE` with your Discord account token
4. Save the file and run the bot

## 🔍 How It Works

### Technology Stack
- **Discord.js SelfBot v13**: Handles Discord communication
- **@discordjs/voice**: Manages voice channel connections
- **shoukaku | kazagumo | raw**: YouTube search functionality
- **shoukaku | kazagumo**: YouTube streaming

### Architecture
1. **User Input**: Commands are received via Discord messages
2. **YouTube Processing**: Queries are processed through YouTube's infrastructure
3. **Audio Streaming**: High-quality audio is streamed directly to Discord
4. **Voice Connection**: Stable voice channel maintenance
5. **Response Handling**: Rich embeds and user feedback

## ❓ Frequently Asked Questions

### 🤔 Is this safe to use?
While the code itself is safe, using selfbots violates Discord's Terms of Service. There is always a risk of account termination when using selfbots.

### 🔧 How to fix common errors?
- **Cannot join voice channel**: Check your voice permissions | Check your lavalink node
- **No audio playback**: Ensure all dependencies are installed | Check your lavalink node
- **YouTube errors**: Verify your internet connection | Check your lavalink node

### 📱 Can I run this on my phone?
Yes! Using Termux on Android, you can run this selfbot on your mobile device.

### 🌐 Does this work with other music platforms?
Yes!

## 🛠️ Troubleshooting

### Common Issues and Solutions

1. **Module not found errors**:
   ```bash
   npm install --force
   ```

2. **Voice connection issues**:
   - Ensure your lavalink node is working
   - Check your internet connection



## 🤝 Support and Community

### Get Help
Join our Discord community for support and updates:

[![Discord](https://img.shields.io/discord/1167459192026714122?color=5865F2&logo=discord&logoColor=white)](https://discord.gg/SyMJymrV8x)

### Report Issues
Found a bug or have a feature request? Open an issue on GitHub or contact us on Discord.

### Contribution Guidelines
We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 Terms


### Important Notice
- **Educational Purpose Only**: This project is intended for educational purposes
- **No Warranty**: Provided without any warranty or guarantee of functionality
- **User Responsibility**: Users are solely responsible for any consequences of using this code
- **Terms Violation**: Using selfbots violates Discord's Terms of Service

## 👨‍💻 Author

**GhoSty || Brutality**
- Discord: @ghostyjija
- GitHub: [WannaBeGhoSt](https://github.com/WannaBeGhoSt)
- Support Server: [Async Development](https://discord.gg/SyMJymrV8x)

## 🙏 Acknowledgments

- Discord.js team for the excellent library
- YouTube for providing content
- Open-source community for various dependencies
- Contributors and testers who helped/will help improve the project

## 🔄 Version History

- **v1.0** (Initial Version)
  - Initial release
  - YouTube playback support
  - Similar songs feature
  - Basic music commands

- **v5.0.0** (Current Version)
  - AI AutoPlay system
  - Playlist support
  - Enhanced audio quality
  - More platform integrations
  - Fluid and reliable

---

**⭐ Star this repository if you find it useful!** This helps the project gain visibility.

**⚠️ Use Responsibly**: Remember that selfbots violate Discord's Terms of Service. Use at your own risk.

**📢 Share responsibly**: Help others discover this project while emphasizing the risks involved.

---

*Tags: discord selfbot, discord music selfbot, youtube music bot, discord.js selfbot, termux music bot, discord music player, youtube to discord, selfbot github, discord music github, nodejs music bot, discord voice channel bot, free music selfbot*