import {
	ChannelType,
	ChatInputCommandInteraction,
	GuildMember,
	PermissionFlagsBits,
	type VoiceBasedChannel,
} from "discord.js";

const SUPPORTED_VOICE_CHANNEL_TYPES = new Set<ChannelType>([
	ChannelType.GuildVoice,
	ChannelType.GuildStageVoice,
]);

export async function getInteractionMember(
	interaction: ChatInputCommandInteraction,
): Promise<GuildMember | null> {
	if (!interaction.inGuild() || !interaction.guild) {
		return null;
	}

	if (interaction.member instanceof GuildMember) {
		return interaction.member;
	}

	try {
		return await interaction.guild.members.fetch(interaction.user.id);
	} catch (error) {
		console.error("Failed to resolve guild member:", error);
		return null;
	}
}

export async function getTargetVoiceChannel(
	interaction: ChatInputCommandInteraction,
): Promise<VoiceBasedChannel | null> {
	const selectedChannel = interaction.options.getChannel("channel", false);

	if (
		selectedChannel?.isVoiceBased() &&
		SUPPORTED_VOICE_CHANNEL_TYPES.has(selectedChannel.type)
	) {
		return selectedChannel;
	}

	const member = await getInteractionMember(interaction);
	return member?.voice.channel ?? null;
}

export function botCanJoinAndSpeak(
	interaction: ChatInputCommandInteraction,
	channel: VoiceBasedChannel,
): boolean {
	const botMember = interaction.guild?.members.me;

	if (!botMember) {
		return false;
	}

	const permissions = channel.permissionsFor(botMember);

	return (
		permissions.has(PermissionFlagsBits.Connect) &&
		permissions.has(PermissionFlagsBits.Speak)
	);
}
