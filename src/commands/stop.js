const { SlashCommandBuilder } = require("discord.js");
const { stopAndLeave } = require("../utils/audioPlayer");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stop current playback and leave the voice channel"),

	async execute(interaction) {
		const result = stopAndLeave(interaction.guild.id);

		return interaction.reply({
			content: result.success
				? `✅ ${result.message}`
				: `❌ ${result.message}`,
			ephemeral: true,
		});
	},
};
