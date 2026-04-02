import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types";
import { playSoundNinja } from "../utils/audioPlayer";
import {
	botCanJoinAndSpeak,
	getTargetVoiceChannel,
} from "../utils/discord";
import { getSound, searchSoundNames } from "../utils/soundManager";

const command: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("ninja")
		.setDescription("Play a sound ninja style: join, play, and vanish")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name of the sound to play")
				.setRequired(true)
				.setAutocomplete(true),
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription(
					"Voice channel to strike (defaults to your current channel)",
				)
				.setRequired(false),
		),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = searchSoundNames(focusedValue);

		await interaction.respond(
			filtered.map((name) => ({ name, value: name })),
		);
	},

	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const name = interaction.options.getString("name", true);
		const sound = getSound(name);

		if (!sound) {
			return interaction.editReply({
				content: `Sound **${name}** not found. A true ninja uses existing sounds.`,
			});
		}

		const voiceChannel = await getTargetVoiceChannel(interaction);

		if (!voiceChannel) {
			return interaction.editReply({
				content:
					"You need to be in a voice channel, or specify one, for your ninja strike.",
			});
		}

		if (!botCanJoinAndSpeak(interaction, voiceChannel)) {
			return interaction.editReply({
				content: "I need Connect and Speak permissions in that voice channel.",
			});
		}

		const result = await playSoundNinja(voiceChannel, name);

		if (result.success) {
			return interaction.editReply({
				content: `Ninja strike complete. Played **${name}** and vanished into the shadows.`,
			});
		}

		return interaction.editReply({
			content: `Ninja mission failed: ${result.message}`,
		});
	},
};

export = command;
