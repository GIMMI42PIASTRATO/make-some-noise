import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { REST, Routes } from "discord.js";
import type { CommandModule } from "./types";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
	throw new Error("DISCORD_TOKEN is required.");
}

if (!clientId) {
	throw new Error("CLIENT_ID is required.");
}

const commandsPath = path.join(__dirname, "commands");
const runtimeExtension = path.extname(__filename);
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter(
		(file) =>
			file.endsWith(runtimeExtension) && !file.endsWith(".d.ts"),
	);

const commands = commandFiles
	.map((file) => {
		const filePath = path.join(commandsPath, file);
		return require(filePath) as CommandModule;
	})
	.filter((command) => "data" in command && "execute" in command)
	.map((command) => command.data.toJSON());

const rest = new REST().setToken(token);

async function deployCommands(): Promise<void> {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`,
		);

		if (guildId) {
			const data = (await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			)) as unknown[];

			console.log(
				`Successfully reloaded ${data.length} guild commands.`,
			);
			return;
		}

		const data = (await rest.put(Routes.applicationCommands(clientId), {
			body: commands,
		})) as unknown[];

		console.log(`Successfully reloaded ${data.length} global commands.`);
	} catch (error) {
		console.error("Error deploying commands:", error);
	}
}

void deployCommands();
