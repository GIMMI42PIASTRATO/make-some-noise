const fs = require("fs");
const path = require("path");

const SOUNDS_DIR = path.join(__dirname, "../../sounds");
const SOUNDS_JSON = path.join(SOUNDS_DIR, "sounds.json");

// Ensure sounds directory and JSON file exist
function ensureSoundsSetup() {
	if (!fs.existsSync(SOUNDS_DIR)) {
		fs.mkdirSync(SOUNDS_DIR, { recursive: true });
	}
	if (!fs.existsSync(SOUNDS_JSON)) {
		fs.writeFileSync(SOUNDS_JSON, JSON.stringify({}, null, 2));
	}
}

// Get all sounds
function getSounds() {
	ensureSoundsSetup();
	try {
		const data = fs.readFileSync(SOUNDS_JSON, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading sounds.json:", error);
		return {};
	}
}

// Save sounds to JSON
function saveSounds(sounds) {
	ensureSoundsSetup();
	fs.writeFileSync(SOUNDS_JSON, JSON.stringify(sounds, null, 2));
}

// Add a new sound
function addSound(name, filename, addedBy) {
	const sounds = getSounds();
	const normalizedName = name.toLowerCase().trim();

	if (sounds[normalizedName]) {
		return { success: false, message: `Sound "${name}" already exists!` };
	}

	sounds[normalizedName] = {
		name: normalizedName,
		filename: filename,
		addedBy: addedBy,
		addedAt: new Date().toISOString(),
		playCount: 0,
	};

	saveSounds(sounds);
	return { success: true, message: `Sound "${name}" added successfully!` };
}

// Remove a sound
function removeSound(name) {
	const sounds = getSounds();
	const normalizedName = name.toLowerCase().trim();

	if (!sounds[normalizedName]) {
		return { success: false, message: `Sound "${name}" not found!` };
	}

	const filename = sounds[normalizedName].filename;
	const filePath = path.join(SOUNDS_DIR, filename);

	// Delete the audio file if it exists
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
	}

	delete sounds[normalizedName];
	saveSounds(sounds);

	return { success: true, message: `Sound "${name}" removed successfully!` };
}

// Get a specific sound
function getSound(name) {
	const sounds = getSounds();
	const normalizedName = name.toLowerCase().trim();
	return sounds[normalizedName] || null;
}

// Get sound file path
function getSoundPath(name) {
	const sound = getSound(name);
	if (!sound) return null;
	return path.join(SOUNDS_DIR, sound.filename);
}

// Increment play count
function incrementPlayCount(name) {
	const sounds = getSounds();
	const normalizedName = name.toLowerCase().trim();

	if (sounds[normalizedName]) {
		sounds[normalizedName].playCount =
			(sounds[normalizedName].playCount || 0) + 1;
		saveSounds(sounds);
	}
}

// Get sound names for autocomplete
function getSoundNames() {
	const sounds = getSounds();
	return Object.keys(sounds);
}

// Get sounds directory path
function getSoundsDirectory() {
	ensureSoundsSetup();
	return SOUNDS_DIR;
}

module.exports = {
	getSounds,
	addSound,
	removeSound,
	getSound,
	getSoundPath,
	incrementPlayCount,
	getSoundNames,
	getSoundsDirectory,
};
