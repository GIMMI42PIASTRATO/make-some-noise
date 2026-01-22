const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
	removeSound,
	getSoundNames,
	getSound,
} = require("../utils/soundManager");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription("Remove a sound from the soundboard")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name of the sound to remove")
				.setRequired(true)
				.setAutocomplete(true),
		),

	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const soundNames = getSoundNames();

		const filtered = soundNames
			.filter((name) => name.includes(focusedValue))
			.slice(0, 25); // Discord limits to 25 choices

		await interaction.respond(
			filtered.map((name) => ({ name: name, value: name })),
		);
	},

	async execute(interaction) {
		const name = interaction.options.getString("name");

		// Check if sound exists
		const sound = getSound(name);
		if (!sound) {
			return interaction.reply({
				content: `❌ Sound **${name}** not found!`,
				ephemeral: true,
			});
		}

		// Optional: Check if user is the one who added it or has manage server permission
		const hasPermission =
			interaction.member.permissions.has(
				PermissionFlagsBits.ManageGuild,
			) || sound.addedBy === interaction.user.id;

		if (!hasPermission) {
			return interaction.reply({
				content:
					"❌ You can only remove sounds you added, or you need Manage Server permission.",
				ephemeral: true,
			});
		}

		const result = removeSound(name);

		if (result.success) {
			return interaction.reply({
				content: `✅ Sound **${name}** has been removed!`,
				ephemeral: true,
			});
		} else {
			return interaction.reply({
				content: `❌ ${result.message}`,
				ephemeral: true,
			});
		}
	},
};
