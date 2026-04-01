import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types";
import { playSound } from "../utils/audioPlayer";
import {
	botCanJoinAndSpeak,
	getTargetVoiceChannel,
} from "../utils/discord";
import { getSoundNames } from "../utils/soundManager";

const command: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("random")
		.setDescription("Play a random sound from the soundboard")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription(
					"Voice channel to play in (defaults to your current channel)",
				)
				.setRequired(false),
		)
		.addBooleanOption((option) =>
			option
				.setName("stay")
				.setDescription("Stay in the voice channel after playing")
				.setRequired(false),
		),

	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const soundNames = getSoundNames();
		const stay = interaction.options.getBoolean("stay") ?? true;

		if (soundNames.length === 0) {
			return interaction.editReply({
				content: "No sounds in the soundboard. Add some with `/add`.",
			});
		}

		const voiceChannel = await getTargetVoiceChannel(interaction);

		if (!voiceChannel) {
			return interaction.editReply({
				content: "You need to be in a voice channel, or specify one, to play sounds.",
			});
		}

		if (!botCanJoinAndSpeak(interaction, voiceChannel)) {
			return interaction.editReply({
				content:
					"I need Connect and Speak permissions in your target voice channel.",
			});
		}

		const randomName =
			soundNames[Math.floor(Math.random() * soundNames.length)];
		const result = await playSound(voiceChannel, randomName, !stay);

		if (!result.success) {
			return interaction.editReply({
				content: result.message,
			});
		}

		return interaction.editReply({
			content: `Random pick: **${randomName}**.`,
		});
	},
};

export = command;
