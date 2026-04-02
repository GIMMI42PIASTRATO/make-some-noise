import fs from "node:fs";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types";
import { addSound, getSoundsDirectory } from "../utils/soundManager";

const SUPPORTED_FORMATS = [".mp3", ".wav", ".ogg", ".webm", ".m4a"] as const;
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

function isSupportedFormat(extension: string): extension is SupportedFormat {
	return SUPPORTED_FORMATS.includes(extension as SupportedFormat);
}

function sanitiseName(name: string): string {
	const normalised = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");

	return normalised || "sound";
}

async function downloadAttachment(
	url: string,
	destination: string,
): Promise<void> {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Download failed with status ${response.status}.`);
	}

	const fileBuffer = Buffer.from(await response.arrayBuffer());
	await writeFile(destination, fileBuffer);
}

const command: CommandModule = {
	data: new SlashCommandBuilder()
		.setName("add")
		.setDescription("Add a new sound to the soundboard")
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription("Name for the sound (used to play it)")
				.setRequired(true)
				.setMaxLength(32),
		)
		.addAttachmentOption((option) =>
			option
				.setName("audio")
				.setDescription("Audio file (mp3, wav, ogg, webm, m4a)")
				.setRequired(true),
		),

	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const name = interaction.options.getString("name", true);
		const attachment = interaction.options.getAttachment("audio", true);
		const extension = path.extname(attachment.name ?? "").toLowerCase();

		if (!isSupportedFormat(extension)) {
			return interaction.editReply({
				content: `Unsupported format. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
			});
		}

		if (attachment.size > MAX_FILE_SIZE_BYTES) {
			return interaction.editReply({
				content: "File too large. Maximum size is 8MB.",
			});
		}

		const filename = `${Date.now()}_${sanitiseName(name)}${extension}`;
		const filePath = path.join(getSoundsDirectory(), filename);

		try {
			await downloadAttachment(attachment.url, filePath);

			const result = addSound(name, filename, interaction.user.id);

			if (!result.success) {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}

				return interaction.editReply({
					content: result.message,
				});
			}

			return interaction.editReply({
				content: `Sound **${name}** added successfully. Use \`/play ${name}\` to play it.`,
			});
		} catch (error) {
			console.error("Error adding sound:", error);

			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}

			return interaction.editReply({
				content:
					"Failed to download and save the audio file. Please try again.",
			});
		}
	},
};

export = command;
