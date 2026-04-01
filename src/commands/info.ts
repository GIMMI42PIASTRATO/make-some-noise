import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types";
import { getSound, searchSoundNames } from "../utils/soundManager";

const command: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Get information about a specific sound")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name of the sound")
				.setRequired(true)
				.setAutocomplete(true),
		),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = searchSoundNames(focusedValue);

		await interaction.respond(
			filtered.map((name) => ({ name, value: name })),
		);
	},

	async execute(interaction) {
		const name = interaction.options.getString("name", true);
		const sound = getSound(name);

		if (!sound) {
			return interaction.reply({
				content: `Sound **${name}** not found.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		let addedByUser = `User ID: ${sound.addedBy}`;

		try {
			const user = await interaction.client.users.fetch(sound.addedBy);
			addedByUser = user.tag;
		} catch (error) {
			console.error("Failed to fetch user for sound info:", error);
		}

		const embed = new EmbedBuilder()
			.setTitle(sound.name)
			.setColor(0x5865f2)
			.addFields(
				{ name: "Filename", value: sound.filename, inline: true },
				{ name: "Added By", value: addedByUser, inline: true },
				{
					name: "Play Count",
					value: `${sound.playCount ?? 0}`,
					inline: true,
				},
				{
					name: "Added On",
					value: new Date(sound.addedAt).toLocaleDateString(),
					inline: true,
				},
			)
			.setTimestamp();

		return interaction.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	},
};

export = command;
