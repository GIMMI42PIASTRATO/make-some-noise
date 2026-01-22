const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Show all available soundboard commands"),

	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle("🎵 Make Some Noise - Commands")
			.setColor(0x5865f2)
			.setDescription(
				"Your Discord soundboard bot! Here are all available commands:",
			)
			.addFields(
				{
					name: "🔊 Playback Commands",
					value: [
						"`/play <name>` - Play a sound (leaves after)",
						"`/play <name> stay:true` - Play and stay in channel",
						"`/ninja <name>` - Quick play and vanish!",
						"`/random` - Play a random sound",
						"`/stop` - Stop playback and leave",
					].join("\n"),
				},
				{
					name: "📝 Management Commands",
					value: [
						"`/add <name> <audio>` - Add a new sound",
						"`/remove <name>` - Remove a sound",
						"`/list` - Show all sounds",
						"`/info <name>` - Get sound details",
					].join("\n"),
				},
				{
					name: "💡 Tips",
					value: [
						"• Sound names are case-insensitive",
						"• Supported formats: mp3, wav, ogg, webm, m4a",
						"• Max file size: 8MB",
						"• You must be in a voice channel to play sounds",
					].join("\n"),
				},
			)
			.setFooter({ text: "Make Some Noise! 🔊" })
			.setTimestamp();

		return interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
};
