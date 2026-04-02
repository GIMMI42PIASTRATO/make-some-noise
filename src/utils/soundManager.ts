import fs from "node:fs";
import path from "node:path";
import type { PlayResult, SoundLibrary, SoundMetadata } from "../types";

const SOUNDS_DIR = path.resolve(__dirname, "../../sounds");
const SOUNDS_JSON = path.join(SOUNDS_DIR, "sounds.json");

function normaliseSoundName(name: string): string {
	return name.toLowerCase().trim();
}

function ensureSoundsSetup(): void {
	if (!fs.existsSync(SOUNDS_DIR)) {
		fs.mkdirSync(SOUNDS_DIR, { recursive: true });
	}

	if (!fs.existsSync(SOUNDS_JSON)) {
		fs.writeFileSync(SOUNDS_JSON, JSON.stringify({}, null, 2), "utf8");
	}
}

function isSoundLibrary(value: unknown): value is SoundLibrary {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getSounds(): SoundLibrary {
	ensureSoundsSetup();

	try {
		const data = fs.readFileSync(SOUNDS_JSON, "utf8");
		const parsed = JSON.parse(data) as unknown;

		if (!isSoundLibrary(parsed)) {
			return {};
		}

		return parsed;
	} catch (error) {
		console.error("Error reading sounds.json:", error);
		return {};
	}
}

function saveSounds(sounds: SoundLibrary): void {
	ensureSoundsSetup();
	fs.writeFileSync(SOUNDS_JSON, JSON.stringify(sounds, null, 2), "utf8");
}

export function addSound(
	name: string,
	filename: string,
	addedBy: string,
): PlayResult {
	const sounds = getSounds();
	const normalisedName = normaliseSoundName(name);

	if (sounds[normalisedName]) {
		return {
			success: false,
			message: `Sound "${name}" already exists!`,
		};
	}

	sounds[normalisedName] = {
		name: normalisedName,
		filename,
		addedBy,
		addedAt: new Date().toISOString(),
		playCount: 0,
	};

	saveSounds(sounds);

	return {
		success: true,
		message: `Sound "${name}" added successfully!`,
	};
}

export function removeSound(name: string): PlayResult {
	const sounds = getSounds();
	const normalisedName = normaliseSoundName(name);
	const sound = sounds[normalisedName];

	if (!sound) {
		return {
			success: false,
			message: `Sound "${name}" not found!`,
		};
	}

	const filePath = path.join(SOUNDS_DIR, sound.filename);

	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
	}

	delete sounds[normalisedName];
	saveSounds(sounds);

	return {
		success: true,
		message: `Sound "${name}" removed successfully!`,
	};
}

export function getSound(name: string): SoundMetadata | null {
	const sounds = getSounds();
	const normalisedName = normaliseSoundName(name);

	return sounds[normalisedName] ?? null;
}

export function getSoundPath(name: string): string | null {
	const sound = getSound(name);

	if (!sound) {
		return null;
	}

	return path.join(SOUNDS_DIR, sound.filename);
}

export function incrementPlayCount(name: string): void {
	const sounds = getSounds();
	const normalisedName = normaliseSoundName(name);
	const sound = sounds[normalisedName];

	if (!sound) {
		return;
	}

	sound.playCount = (sound.playCount ?? 0) + 1;
	saveSounds(sounds);
}

export function getSoundNames(): string[] {
	return Object.keys(getSounds()).sort((left, right) =>
		left.localeCompare(right),
	);
}

export function searchSoundNames(query: string, limit = 25): string[] {
	const normalisedQuery = normaliseSoundName(query);

	return getSoundNames()
		.filter((name) => name.includes(normalisedQuery))
		.slice(0, limit);
}

export function getSoundsDirectory(): string {
	ensureSoundsSetup();
	return SOUNDS_DIR;
}
