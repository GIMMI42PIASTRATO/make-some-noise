import {
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { CommandModule } from "../types";
import { getInteractionMember } from "../utils/discord";
import {
	getSound,
	removeSound,
	searchSoundNames,
} from "../utils/soundManager";

const command: CommandModule = {
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

		const member = await getInteractionMember(interaction);
		const hasPermission =
			member?.permissions.has(PermissionFlagsBits.ManageGuild) === true ||
			sound.addedBy === interaction.user.id;

		if (!hasPermission) {
			return interaction.reply({
				content:
					"You can only remove sounds you added, unless you have Manage Server permission.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const result = removeSound(name);

		return interaction.reply({
			content: result.success
				? `Sound **${name}** has been removed.`
				: result.message,
			flags: MessageFlags.Ephemeral,
		});
	},
};

export = command;
