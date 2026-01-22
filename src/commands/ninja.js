const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { playSoundNinja } = require("../utils/audioPlayer");
const { getSoundNames, getSound } = require("../utils/soundManager");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ninja")
		.setDescription("🥷 Play a sound ninja style - join, play, and vanish!")
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
					"Voice channel to strike (optional, defaults to your current channel)",
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

	async execute(interaction) {
		// Use deferReply for ninja mode - we want to be quick!
		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString("name");
		const specifiedChannel = interaction.options.getChannel("channel");

		// Check if sound exists
		const sound = getSound(name);
		if (!sound) {
			return interaction.editReply({
				content: `❌ Sound **${name}** not found! A true ninja uses existing sounds.`,
			});
		}

		// Use specified channel or user's current voice channel
		const voiceChannel =
			specifiedChannel || interaction.member?.voice?.channel;

		if (!voiceChannel) {
			return interaction.editReply({
				content:
					"❌ You need to be in a voice channel or specify a target for your ninja strike!",
			});
		}

		// Check bot permissions
		const permissions = voiceChannel.permissionsFor(
			interaction.client.user,
		);
		if (!permissions.has("Connect") || !permissions.has("Speak")) {
			return interaction.editReply({
				content:
					"❌ Even ninjas need permissions! I need Connect and Speak access.",
			});
		}

		// Play the sound ninja style
		const result = await playSoundNinja(voiceChannel, name);

		if (result.success) {
			return interaction.editReply({
				content: `🥷 **Ninja strike complete!** Played **${name}** and vanished into the shadows...`,
			});
		} else {
			console.error(`ERROR: ${result.message}`);
			return interaction.editReply({
				content: `❌ Ninja mission failed: ${result.message}`,
			});
		}
	},
};
