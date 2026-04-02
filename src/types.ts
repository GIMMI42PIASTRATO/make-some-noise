import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

export interface SoundMetadata {
	name: string;
	filename: string;
	addedBy: string;
	addedAt: string;
	playCount: number;
}

export type SoundLibrary = Record<string, SoundMetadata>;

export type SlashCommandData = Pick<SlashCommandBuilder, "name" | "toJSON">;

export interface CommandModule {
	data: SlashCommandData;
	execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
	autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface PlayResult {
	success: boolean;
	message: string;
}
