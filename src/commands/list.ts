import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types";
import { getSounds, getSoundNames } from "../utils/soundManager";

const ITEMS_PER_PAGE = 10;

const command: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("list")
		.setDescription("List all available sounds in the soundboard")
		.addIntegerOption((option) =>
			option
				.setName("page")
				.setDescription("Page number")
				.setRequired(false)
				.setMinValue(1),
		),

	async execute(interaction) {
		const sounds = getSounds();
		const soundNames = getSoundNames();

		if (soundNames.length === 0) {
			return interaction.reply({
				content:
					"No sounds in the soundboard yet. Use `/add` to add some.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const totalPages = Math.ceil(soundNames.length / ITEMS_PER_PAGE);
		const requestedPage = interaction.options.getInteger("page") ?? 1;
		const page = Math.min(Math.max(1, requestedPage), totalPages);
		const startIndex = (page - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		const pageSounds = soundNames.slice(startIndex, endIndex);

		const embed = new EmbedBuilder()
			.setTitle("Soundboard")
			.setColor(0x5865f2)
			.setDescription(
				pageSounds
					.map((name, index) => {
						const sound = sounds[name];
						const playCount = sound?.playCount ?? 0;

						return `**${startIndex + index + 1}.** \`${name}\` - ${playCount} plays`;
					})
					.join("\n"),
			)
			.setFooter({
				text: `Page ${page}/${totalPages} | ${soundNames.length} total sounds`,
			})
			.setTimestamp();

		return interaction.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	},
};

export = command;
