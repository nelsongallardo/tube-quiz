/**
 * Tube Sound Player
 *
 * Loads and plays real London Underground recordings from the sounds/ directory.
 * Each line has a corresponding MP3 file named by its ID (e.g. bakerloo.mp3).
 *
 * Audio sources (CC-BY licensed from Freesound.org):
 *   - Bakerloo:      Kalou - "London Underground: Bakerloo line ambience" (343141)
 *   - Central:       ermine - "Central Line, mind the doors" (60485)
 *   - Circle:        Kalou - "London Underground: Circle line ambience" (343145)
 *   - District:      kwahmah_02 - "Evening District Line journey" (327943)
 *   - Hammersmith:   innov8ting - via Circle/H&C shared S-stock recording
 *   - Jubilee:       Kalou - "London Underground: Jubilee line ambience" (343144)
 *   - Metropolitan:  kwahmah_02 - "Baker Street to Piccadilly Circus" (267697)
 *   - Northern:      ERH - "Bank to Camden Town via Northern Line" (56639)
 *   - Piccadilly:    kwahmah_02 - "Piccadilly Circus station" (327944)
 *   - Victoria:      Emanuele_Correani - "Inside Victoria Line train" (332777)
 *   - Elizabeth:     (record your own - newest line, limited free recordings)
 *   - Waterloo:      doubletrigger - "1996 Stock Jubilee/Waterloo" (100953)
 *
 * See SOUNDS.md for download instructions.
 */

const TUBE_LINES = [
    {
        id: 'bakerloo',
        name: 'Bakerloo',
        color: '#B36305',
        description: 'Deep rumble with heavy rattle — oldest rolling stock on the network',
    },
    {
        id: 'central',
        name: 'Central',
        color: '#E32017',
        description: 'High-pitched whine with strong tunnel resonance — deep level tube',
    },
    {
        id: 'circle',
        name: 'Circle',
        color: '#FFD300',
        textColor: '#1d1d1b',
        description: 'Open, airy sound with gentle S-stock hum — sub-surface line',
    },
    {
        id: 'district',
        name: 'District',
        color: '#00782A',
        description: 'Moderate rumble, mixed tunnel and open sections — S-stock trains',
    },
    {
        id: 'hammersmith',
        name: 'Hammersmith & City',
        color: '#F3A9BB',
        textColor: '#1d1d1b',
        description: 'Light, open sound — shares S-stock but shallower sections',
    },
    {
        id: 'jubilee',
        name: 'Jubilee',
        color: '#A0A5A9',
        textColor: '#1d1d1b',
        description: 'Smooth modern hum with deep bass — 1996 stock in deep tunnels',
    },
    {
        id: 'metropolitan',
        name: 'Metropolitan',
        color: '#9B0056',
        description: 'Spacious echo with rhythmic clatter — sub-surface, longer distances',
    },
    {
        id: 'northern',
        name: 'Northern',
        color: '#000000',
        description: 'Intense low roar with screech on curves — deepest sections',
    },
    {
        id: 'piccadilly',
        name: 'Piccadilly',
        color: '#003688',
        description: 'Distinctive drone with tunnel amplification — deep level, 1973 stock',
    },
    {
        id: 'victoria',
        name: 'Victoria',
        color: '#0098D4',
        description: 'Clean electric hum, fast acceleration whine — 2009 stock, automated',
    },
    {
        id: 'elizabeth',
        name: 'Elizabeth',
        color: '#6950A1',
        description: 'Quiet modern glide with gentle acceleration — brand new Aventra trains',
    },
    {
        id: 'waterloo',
        name: 'Waterloo & City',
        color: '#95CDBA',
        textColor: '#1d1d1b',
        description: 'Short, enclosed echo with 1992 stock motor — tiny two-station line',
    },
];

class TubeSoundEngine {
    constructor() {
        this.audio = null;
        this.loaded = {};
        this.clipStart = {};
        this.clipDuration = 8; // seconds per quiz clip
    }

    /**
     * Preload all available sound files and determine which lines are playable.
     * Returns a list of line IDs that have audio files.
     */
    async preload() {
        const available = [];
        for (const line of TUBE_LINES) {
            try {
                const resp = await fetch(`sounds/${line.id}.mp3`, { method: 'HEAD' });
                if (resp.ok) {
                    available.push(line.id);
                    this.loaded[line.id] = true;
                }
            } catch (e) {
                // file not found, skip this line
            }
        }
        return available;
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
    }

    /**
     * Play a clip from the line's sound file.
     * Picks a random segment from the recording for variety.
     */
    play(lineId, duration) {
        this.stop();
        const dur = duration || this.clipDuration;

        return new Promise((resolve, reject) => {
            const audio = new Audio(`sounds/${lineId}.mp3`);
            this.audio = audio;

            audio.addEventListener('loadedmetadata', () => {
                // Pick a random start point, avoiding the very start/end
                const maxStart = Math.max(0, audio.duration - dur - 1);
                const start = maxStart > 2 ? 2 + Math.random() * (maxStart - 2) : 0;
                audio.currentTime = start;
                audio.play();

                // Stop after duration
                const timer = setTimeout(() => {
                    audio.pause();
                    this.audio = null;
                    resolve();
                }, dur * 1000);

                audio.addEventListener('ended', () => {
                    clearTimeout(timer);
                    this.audio = null;
                    resolve();
                });
            });

            audio.addEventListener('error', () => {
                reject(new Error(`Could not load sound for ${lineId}`));
            });
        });
    }
}
