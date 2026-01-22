const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	entersState,
	getVoiceConnection,
} = require("@discordjs/voice");
const path = require("path");
const { getSoundPath, incrementPlayCount } = require("./soundManager");

// Map to store active connections
const activeConnections = new Map();

/**
 * Play a sound in a voice channel
 * @param {VoiceChannel} voiceChannel - The voice channel to join
 * @param {string} soundName - The name of the sound to play
 * @param {boolean} leaveAfter - Whether to leave after playing
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function playSound(voiceChannel, soundName, leaveAfter = true) {
	const soundPath = getSoundPath(soundName);

	if (!soundPath) {
		return { success: false, message: `Sound "${soundName}" not found!` };
	}

	// Check if file exists
	const fs = require("fs");
	if (!fs.existsSync(soundPath)) {
		return {
			success: false,
			message: `Audio file for "${soundName}" is missing!`,
		};
	}

	try {
		// Get existing connection or create new one
		let connection = getVoiceConnection(voiceChannel.guild.id);

		if (
			!connection ||
			connection.state.status === VoiceConnectionStatus.Destroyed ||
			connection.state.status === VoiceConnectionStatus.Disconnected
		) {
			connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: voiceChannel.guild.id,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
				selfDeaf: true,
				selfMute: false,
			});

			activeConnections.set(voiceChannel.guild.id, connection);

			// Handle disconnection events
			connection.on(VoiceConnectionStatus.Disconnected, async () => {
				try {
					// Try to reconnect if disconnected
					await Promise.race([
						entersState(
							connection,
							VoiceConnectionStatus.Signalling,
							5000,
						),
						entersState(
							connection,
							VoiceConnectionStatus.Connecting,
							5000,
						),
					]);
					// Seems to be reconnecting
				} catch (error) {
					// Disconnected and not reconnecting
					connection.destroy();
					activeConnections.delete(voiceChannel.guild.id);
				}
			});
		}

		// Wait for connection to be ready (may go through Signalling -> Connecting -> Ready)
		try {
			// If already ready, skip waiting
			if (connection.state.status !== VoiceConnectionStatus.Ready) {
				await entersState(
					connection,
					VoiceConnectionStatus.Ready,
					20000,
				);
			}
		} catch (error) {
			console.error("Connection error:", error);
			connection.destroy();
			activeConnections.delete(voiceChannel.guild.id);
			return {
				success: false,
				message: "Failed to connect to voice channel!",
			};
		}

		// Create audio player and resource
		const player = createAudioPlayer();
		const resource = createAudioResource(soundPath);

		// Subscribe connection to player
		connection.subscribe(player);

		// Play the audio
		player.play(resource);

		// Increment play count
		incrementPlayCount(soundName);

		// Handle player events
		return new Promise((resolve) => {
			player.on(AudioPlayerStatus.Idle, () => {
				if (leaveAfter) {
					connection.destroy();
					activeConnections.delete(voiceChannel.guild.id);
				}
				resolve({
					success: true,
					message: `Played "${soundName}" successfully!`,
				});
			});

			player.on("error", (error) => {
				console.error("Audio player error:", error);
				if (leaveAfter) {
					connection.destroy();
					activeConnections.delete(voiceChannel.guild.id);
				}
				resolve({
					success: false,
					message: `Error playing "${soundName}": ${error.message}`,
				});
			});
		});
	} catch (error) {
		console.error("Error in playSound:", error);
		return {
			success: false,
			message: `Failed to play sound: ${error.message}`,
		};
	}
}

/**
 * Play a sound and leave immediately (ninja mode)
 * @param {VoiceChannel} voiceChannel - The voice channel to join
 * @param {string} soundName - The name of the sound to play
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function playSoundNinja(voiceChannel, soundName) {
	return playSound(voiceChannel, soundName, true);
}

/**
 * Stop playback and leave voice channel
 * @param {string} guildId - The guild ID
 * @returns {{success: boolean, message: string}}
 */
function stopAndLeave(guildId) {
	const connection = activeConnections.get(guildId);

	if (!connection) {
		return {
			success: false,
			message: "Not connected to any voice channel!",
		};
	}

	connection.destroy();
	activeConnections.delete(guildId);

	return { success: true, message: "Stopped playback and left the channel!" };
}

/**
 * Check if bot is connected to a voice channel in a guild
 * @param {string} guildId - The guild ID
 * @returns {boolean}
 */
function isConnected(guildId) {
	const connection = activeConnections.get(guildId);
	return (
		connection &&
		connection.state.status !== VoiceConnectionStatus.Destroyed
	);
}

module.exports = {
	playSound,
	playSoundNinja,
	stopAndLeave,
	isConnected,
};
