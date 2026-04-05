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
 *   - Jubilee:       Kalou - "London Underground: Jubilee line ambience" (343144)
 *   - Metropolitan:  Kalou - "London Underground: Metropolitan line ambience" (343143)
 *   - Northern:      ERH - "Bank to Camden Town via Northern Line" (56639)
 *   - Piccadilly:    robkubicki - "London Underground - Piccadilly Line - On train" (337663)
 *   - Victoria:      Emanuele_Correani - "Inside Victoria Line train" (332777)
 *   - Elizabeth:     (record your own - newest line, limited free recordings)
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
        const checks = TUBE_LINES.map(async (line) => {
            try {
                const resp = await fetch(`sounds/${line.id}.mp3`, { method: 'HEAD' });
                if (resp.ok) {
                    this.loaded[line.id] = true;
                    return line.id;
                }
            } catch (e) {}
            return null;
        });
        const results = await Promise.all(checks);
        return results.filter(Boolean);
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
    }

    /**
     * Play the line's sound file from the start.
     * Clips are already trimmed to ~15 seconds.
     */
    play(lineId) {
        this.stop();

        return new Promise((resolve, reject) => {
            const audio = new Audio(`sounds/${lineId}.mp3`);
            this.audio = audio;

            audio.addEventListener('canplaythrough', () => {
                audio.play().catch(reject);
            }, { once: true });

            audio.addEventListener('ended', () => {
                this.audio = null;
                resolve();
            }, { once: true });

            audio.addEventListener('error', () => {
                reject(new Error(`Could not load sound for ${lineId}`));
            }, { once: true });

            audio.load();
        });
    }
}
