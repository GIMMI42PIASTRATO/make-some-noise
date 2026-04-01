import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types";
import { stopAndLeave } from "../utils/audioPlayer";

const command: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stop current playback and leave the voice channel"),

	async execute(interaction) {
		if (!interaction.guildId) {
			return interaction.reply({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const result = stopAndLeave(interaction.guildId);

		return interaction.reply({
			content: result.message,
			flags: MessageFlags.Ephemeral,
		});
	},
};

export = command;
