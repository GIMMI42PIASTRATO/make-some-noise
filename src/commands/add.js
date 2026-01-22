const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { addSound, getSoundsDirectory } = require("../utils/soundManager");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Supported audio formats
const SUPPORTED_FORMATS = [".mp3", ".wav", ".ogg", ".webm", ".m4a"];

module.exports = {
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
		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString("name");
		const attachment = interaction.options.getAttachment("audio");

		// Validate file extension
		const ext = path.extname(attachment.name).toLowerCase();
		if (!SUPPORTED_FORMATS.includes(ext)) {
			return interaction.editReply({
				content: `❌ Unsupported format! Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
			});
		}

		// Validate file size (max 8MB)
		const maxSize = 8 * 1024 * 1024;
		if (attachment.size > maxSize) {
			return interaction.editReply({
				content: "❌ File too large! Maximum size is 8MB.",
			});
		}

		// Generate unique filename
		const filename = `${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}${ext}`;
		const filePath = path.join(getSoundsDirectory(), filename);

		try {
			// Download the file
			await downloadFile(attachment.url, filePath);

			// Add to sounds database
			const result = addSound(name, filename, interaction.user.id);

			if (!result.success) {
				// Clean up downloaded file if adding failed
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
				return interaction.editReply({
					content: `❌ ${result.message}`,
				});
			}

			return interaction.editReply({
				content: `✅ Sound **${name}** added successfully!\nUse \`/play ${name}\` to play it.`,
			});
		} catch (error) {
			console.error("Error adding sound:", error);
			// Clean up on error
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
			return interaction.editReply({
				content:
					"❌ Failed to download and save the audio file. Please try again.",
			});
		}
	},
};

// Helper function to download file
function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		const protocol = url.startsWith("https") ? https : http;

		protocol
			.get(url, (response) => {
				// Handle redirects
				if (
					response.statusCode === 301 ||
					response.statusCode === 302
				) {
					file.close();
					fs.unlinkSync(dest);
					downloadFile(response.headers.location, dest)
						.then(resolve)
						.catch(reject);
					return;
				}

				response.pipe(file);

				file.on("finish", () => {
					file.close();
					resolve();
				});
			})
			.on("error", (err) => {
				fs.unlink(dest, () => {}); // Delete partial file
				reject(err);
			});
	});
}
