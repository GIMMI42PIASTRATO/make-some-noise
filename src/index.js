require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Create Discord client with necessary intents
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
	],
});

// Collection to store commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
		console.log(`✅ Loaded command: ${command.data.name}`);
	} else {
		console.log(
			`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`,
		);
	}
}

// Bot ready event
client.once("clientReady", () => {
	console.log(
		`🎵 ${client.user.tag} is online and ready to make some noise!`,
	);
	console.log(`📊 Serving ${client.guilds.cache.size} servers`);
});

// Handle slash command interactions
client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) {
			console.error(
				`No command matching ${interaction.commandName} was found.`,
			);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}:`, error);
			const errorMessage = {
				content: "❌ There was an error executing this command!",
				ephemeral: true,
			};

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(errorMessage);
			} else {
				await interaction.reply(errorMessage);
			}
		}
	} else if (interaction.isAutocomplete()) {
		const command = client.commands.get(interaction.commandName);

		if (!command || !command.autocomplete) {
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(
				`Error in autocomplete for ${interaction.commandName}:`,
				error,
			);
		}
	}
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
