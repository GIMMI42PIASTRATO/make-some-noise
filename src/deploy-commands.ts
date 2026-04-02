import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { REST, Routes } from "discord.js";
import type { CommandModule } from "./types";

function getRequiredEnv(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required.`);
	}

	return value;
}

const token = getRequiredEnv("DISCORD_TOKEN");
const clientId = getRequiredEnv("CLIENT_ID");
const guildId = process.env.GUILD_ID;

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
