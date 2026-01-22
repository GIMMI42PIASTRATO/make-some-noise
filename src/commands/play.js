const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { playSound } = require("../utils/audioPlayer");
const { getSoundNames, getSound } = require("../utils/soundManager");
const { ChatInputCommandInteraction } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Play a sound from the soundboard")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name of the sound to play")
				.setRequired(true)
				.setAutocomplete(true),
		)
		.addBooleanOption((option) =>
			option
				.setName("stay")
				.setDescription(
					"Stay in voice channel after playing (default: stay)",
				)
				.setRequired(false),
		)
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

	/**
	 *
	 * @param {ChatInputCommandInteraction} interaction
	 * @returns
	 */

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString("name");
		const stay = interaction.options.getBoolean("stay") ?? true;
		const specifiedChannel = interaction.options.getChannel("channel");

		// Check if sound exists
		const sound = getSound(name);
		if (!sound) {
			return interaction.editReply({
				content: `❌ Sound **${name}** not found! Use \`/list\` to see available sounds.`,
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

		// Play the sound
		const result = await playSound(voiceChannel, name, !stay);

		if (result.success) {
			return interaction.editReply({
				content: `🔊 Playing **${name}**${stay ? " (staying in channel)" : ""}!`,
			});
		} else {
			return interaction.editReply({
				content: `❌ ${result.message}`,
			});
		}
	},
};
