# 🎵 Make Some Noise - Discord Soundboard Bot

A Discord bot that lets you play custom sounds in voice channels. Perfect for reactions, memes, and fun moments!

## Features

- 🔊 **Play sounds** in voice channels
- 📝 **Add/Remove** custom sounds
- 🥷 **Ninja mode** - Quick play and vanish
- 🎲 **Random sound** playback
- 📋 **List** all available sounds
- ℹ️ **Sound info** with play statistics

## Setup

### Prerequisites

- Node.js 18 or higher
- A Discord bot token
- FFmpeg (optional, but recommended for better audio support)

### Installation

1. **Clone or download this project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file:**
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here  # Optional: for faster command deployment during testing
   ```

### Getting Bot Token & Client ID

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the **Token** - this is your `DISCORD_TOKEN`
5. Go to "OAuth2" > "General" and copy the **Client ID** - this is your `CLIENT_ID`

### Bot Permissions

When inviting the bot to your server, make sure it has these permissions:
- Send Messages
- Use Slash Commands
- Connect (voice)
- Speak (voice)

**OAuth2 URL Generator scopes:** `bot`, `applications.commands`

**Bot permissions:** `3147776` (Send Messages, Connect, Speak)

Example invite URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3147776&scope=bot%20applications.commands
```

### Deploy Commands

Deploy slash commands to Discord:

```bash
npm run deploy
```

> Note: Global commands take up to 1 hour to propagate. Use `GUILD_ID` for instant updates during development.

### Start the Bot

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `/play <name>` | Play a sound in your voice channel |
| `/ninja <name>` | Play a sound and immediately leave |
| `/random` | Play a random sound |
| `/add <name> <audio>` | Add a new sound |
| `/remove <name>` | Remove a sound |
| `/list` | List all available sounds |
| `/info <name>` | Get details about a sound |
| `/stop` | Stop playback and leave channel |
| `/help` | Show all commands |

## Supported Audio Formats

- MP3 (`.mp3`)
- WAV (`.wav`)
- OGG (`.ogg`)
- WebM (`.webm`)
- M4A (`.m4a`)

Maximum file size: **8MB**

## Project Structure

```
make-some-noise/
├── src/
│   ├── index.js              # Main bot file
│   ├── deploy-commands.js    # Command deployment script
│   ├── commands/             # Slash commands
│   │   ├── add.js
│   │   ├── remove.js
│   │   ├── play.js
│   │   ├── ninja.js
│   │   ├── random.js
│   │   ├── list.js
│   │   ├── info.js
│   │   ├── stop.js
│   │   └── help.js
│   └── utils/
│       ├── soundManager.js   # Sound file management
│       └── audioPlayer.js    # Voice channel audio playback
├── sounds/                   # Audio files storage
│   └── sounds.json           # Sound metadata database
├── package.json
├── .env.example
└── README.md
```

## Troubleshooting

### Bot doesn't respond to commands
- Make sure you ran `npm run deploy` to register commands
- Check if the bot has proper permissions in your server
- Verify your `DISCORD_TOKEN` is correct

### No sound plays
- Make sure you're in a voice channel
- Check if the bot has Connect and Speak permissions
- Verify the audio file exists in the sounds folder

### "Cannot find module" errors
- Run `npm install` to install all dependencies
- Make sure you're using Node.js 18 or higher

## License

MIT

---

Made with ❤️ and lots of noise 🔊
