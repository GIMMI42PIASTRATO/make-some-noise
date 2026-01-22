const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getSounds } = require("../utils/soundManager");

module.exports = {
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
		const soundNames = Object.keys(sounds);

		if (soundNames.length === 0) {
			return interaction.reply({
				content:
					"📭 No sounds in the soundboard yet! Use `/add` to add some.",
				ephemeral: true,
			});
		}

		// Pagination
		const itemsPerPage = 10;
		const totalPages = Math.ceil(soundNames.length / itemsPerPage);
		let page = interaction.options.getInteger("page") || 1;
		page = Math.min(Math.max(1, page), totalPages);

		const startIndex = (page - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		const pageSounds = soundNames.slice(startIndex, endIndex);

		// Create embed
		const embed = new EmbedBuilder()
			.setTitle("🎵 Soundboard")
			.setColor(0x5865f2)
			.setDescription(
				pageSounds
					.map((name, index) => {
						const sound = sounds[name];
						const playCount = sound.playCount || 0;
						return `**${startIndex + index + 1}.** \`${name}\` - 🔊 ${playCount} plays`;
					})
					.join("\n"),
			)
			.setFooter({
				text: `Page ${page}/${totalPages} • ${soundNames.length} total sounds`,
			})
			.setTimestamp();

		return interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
};
