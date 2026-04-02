import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
	Client,
	Collection,
	GatewayIntentBits,
	MessageFlags,
} from "discord.js";
import type { CommandModule } from "./types";

type BotClient = Client & {
	commands: Collection<string, CommandModule>;
};

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as BotClient;

client.commands = new Collection<string, CommandModule>();

const commandsPath = path.join(__dirname, "commands");
const runtimeExtension = path.extname(__filename);
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter(
		(file) =>
			file.endsWith(runtimeExtension) && !file.endsWith(".d.ts"),
	);

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath) as CommandModule;

	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
		console.log(`Loaded command: ${command.data.name}`);
	} else {
		console.warn(
			`Command at ${filePath} is missing the required "data" or "execute" export.`,
		);
	}
}

client.once("clientReady", (readyClient) => {
	console.log(
		`${readyClient.user.tag} is online and ready to make some noise!`,
	);
	console.log(`Serving ${readyClient.guilds.cache.size} servers`);
});

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

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: "There was an error executing this command!",
					flags: MessageFlags.Ephemeral as const,
				});
			} else {
				await interaction.reply({
					content: "There was an error executing this command!",
					flags: MessageFlags.Ephemeral as const,
				});
			}
		}

		return;
	}

	if (!interaction.isAutocomplete()) {
		return;
	}

	const command = client.commands.get(interaction.commandName);

	if (!command?.autocomplete) {
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
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
	throw new Error("DISCORD_TOKEN is required.");
}

void client.login(token);
