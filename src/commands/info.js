const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getSoundNames, getSound } = require("../utils/soundManager");

module.exports = {
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
		const soundNames = getSoundNames();

		const filtered = soundNames
			.filter((name) => name.includes(focusedValue))
			.slice(0, 25);

		await interaction.respond(
			filtered.map((name) => ({ name: name, value: name })),
		);
	},

	async execute(interaction) {
		const name = interaction.options.getString("name");
		const sound = getSound(name);

		if (!sound) {
			return interaction.reply({
				content: `❌ Sound **${name}** not found!`,
				ephemeral: true,
			});
		}

		// Try to get user who added the sound
		let addedByUser = "Unknown";
		try {
			const user = await interaction.client.users.fetch(sound.addedBy);
			addedByUser = user.tag;
		} catch (e) {
			addedByUser = `User ID: ${sound.addedBy}`;
		}

		const embed = new EmbedBuilder()
			.setTitle(`🔊 ${sound.name}`)
			.setColor(0x5865f2)
			.addFields(
				{ name: "📁 Filename", value: sound.filename, inline: true },
				{ name: "👤 Added By", value: addedByUser, inline: true },
				{
					name: "🔊 Play Count",
					value: `${sound.playCount || 0}`,
					inline: true,
				},
				{
					name: "📅 Added On",
					value: new Date(sound.addedAt).toLocaleDateString(),
					inline: true,
				},
			)
			.setTimestamp();

		return interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
};
