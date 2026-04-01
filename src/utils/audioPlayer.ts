import fs from "node:fs";
import {
	AudioPlayerStatus,
	VoiceConnectionStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	getVoiceConnection,
	joinVoiceChannel,
	type AudioPlayer,
	type VoiceConnection,
} from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";
import type { PlayResult } from "../types";
import { getSoundPath, incrementPlayCount } from "./soundManager";

const activeConnections = new Map<string, VoiceConnection>();
const activePlayers = new Map<string, AudioPlayer>();

function destroyConnection(guildId: string): void {
	const connection =
		activeConnections.get(guildId) ?? getVoiceConnection(guildId);

	connection?.destroy();
	activeConnections.delete(guildId);
}

function stopPlayer(guildId: string): void {
	const player = activePlayers.get(guildId);

	if (!player) {
		return;
	}

	player.stop(true);
	activePlayers.delete(guildId);
}

function cleanupGuildAudio(guildId: string): void {
	stopPlayer(guildId);
	destroyConnection(guildId);
}

function registerConnection(
	guildId: string,
	connection: VoiceConnection,
): VoiceConnection {
	connection.on(VoiceConnectionStatus.Disconnected, async () => {
		try {
			await Promise.race([
				entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
			]);
		} catch (error) {
			console.error("Voice connection disconnected permanently:", error);
			cleanupGuildAudio(guildId);
		}
	});

	activeConnections.set(guildId, connection);
	return connection;
}

async function getOrCreateConnection(
	voiceChannel: VoiceBasedChannel,
): Promise<VoiceConnection> {
	const guildId = voiceChannel.guild.id;
	const existingConnection =
		activeConnections.get(guildId) ?? getVoiceConnection(guildId);

	if (
		existingConnection &&
		existingConnection.state.status !== VoiceConnectionStatus.Destroyed &&
		existingConnection.state.status !== VoiceConnectionStatus.Disconnected
	) {
		activeConnections.set(guildId, existingConnection);
		return existingConnection;
	}

	if (existingConnection) {
		cleanupGuildAudio(guildId);
	}

	const connection = joinVoiceChannel({
		channelId: voiceChannel.id,
		guildId,
		adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		selfDeaf: true,
		selfMute: false,
	});

	return registerConnection(guildId, connection);
}

export async function playSound(
	voiceChannel: VoiceBasedChannel,
	soundName: string,
	leaveAfter = true,
): Promise<PlayResult> {
	const soundPath = getSoundPath(soundName);

	if (!soundPath) {
		return {
			success: false,
			message: `Sound "${soundName}" not found!`,
		};
	}

	if (!fs.existsSync(soundPath)) {
		return {
			success: false,
			message: `Audio file for "${soundName}" is missing!`,
		};
	}

	const guildId = voiceChannel.guild.id;

	try {
		const connection = await getOrCreateConnection(voiceChannel);

		if (connection.state.status !== VoiceConnectionStatus.Ready) {
			await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
		}

		const player = createAudioPlayer();
		const resource = createAudioResource(soundPath);

		activePlayers.set(guildId, player);
		connection.subscribe(player);
		player.play(resource);
		incrementPlayCount(soundName);

		return await new Promise<PlayResult>((resolve) => {
			const finalize = (result: PlayResult): void => {
				if (activePlayers.get(guildId) === player) {
					activePlayers.delete(guildId);
				}

				resolve(result);
			};

			player.once(AudioPlayerStatus.Idle, () => {
				if (leaveAfter) {
					destroyConnection(guildId);
				}

				finalize({
					success: true,
					message: `Played "${soundName}" successfully!`,
				});
			});

			player.once("error", (error) => {
				console.error("Audio player error:", error);

				if (leaveAfter) {
					destroyConnection(guildId);
				}

				finalize({
					success: false,
					message: `Error playing "${soundName}": ${error.message}`,
				});
			});
		});
	} catch (error) {
		console.error("Error in playSound:", error);
		cleanupGuildAudio(guildId);

		return {
			success: false,
			message:
				error instanceof Error
					? `Failed to play sound: ${error.message}`
					: "Failed to play sound.",
		};
	}
}

export function playSoundNinja(
	voiceChannel: VoiceBasedChannel,
	soundName: string,
): Promise<PlayResult> {
	return playSound(voiceChannel, soundName, true);
}

export function stopAndLeave(guildId: string): PlayResult {
	const connection =
		activeConnections.get(guildId) ?? getVoiceConnection(guildId);
	const player = activePlayers.get(guildId);

	if (!connection && !player) {
		return {
			success: false,
			message: "Not connected to any voice channel!",
		};
	}

	cleanupGuildAudio(guildId);

	return {
		success: true,
		message: "Stopped playback and left the channel!",
	};
}

export function isConnected(guildId: string): boolean {
	const connection =
		activeConnections.get(guildId) ?? getVoiceConnection(guildId);

	return (
		connection !== undefined &&
		connection.state.status !== VoiceConnectionStatus.Destroyed
	);
}
