const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { playSound } = require("../utils/audioPlayer");
const { getSoundNames } = require("../utils/soundManager");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("random")
		.setDescription("Play a random sound from the soundboard")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription(
					"Voice channel to play in (optional, defaults to your current channel)",
				)
				.addChannelTypes(
					ChannelType.GuildVoice,
					ChannelType.GuildStageVoice,
				)
				.setRequired(false),
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const soundNames = getSoundNames();
		const specifiedChannel = interaction.options.getChannel("channel");

		if (soundNames.length === 0) {
			return interaction.editReply({
				content:
					"📭 No sounds in the soundboard! Add some with `/add`.",
			});
		}

		// Use specified channel or user's current voice channel
		const voiceChannel =
			specifiedChannel || interaction.member?.voice?.channel;

		if (!voiceChannel) {
			return interaction.editReply({
				content:
					"❌ You need to be in a voice channel or specify a channel to play in!",
			});
		}

		// Check bot permissions
		const permissions = voiceChannel.permissionsFor(
			interaction.client.user,
		);
		if (!permissions.has("Connect") || !permissions.has("Speak")) {
			return interaction.editReply({
				content:
					"❌ I need permissions to connect and speak in your voice channel!",
			});
		}

		// Pick random sound
		const randomName =
			soundNames[Math.floor(Math.random() * soundNames.length)];

		// Play the sound
		const result = await playSound(voiceChannel, randomName, true);

		if (result.success) {
			return interaction.editReply({
				content: `🎲 Random pick: **${randomName}**! 🔊`,
			});
		} else {
			return interaction.editReply({
				content: `❌ ${result.message}`,
			});
		}
	},
};
