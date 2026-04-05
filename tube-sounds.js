/**
 * Tube Sound Synthesizer
 *
 * Each London Underground line has distinctive acoustic characteristics based on
 * tunnel shape/size, train stock, rail type, and depth. This module synthesizes
 * recognisable approximations of each line's sound using the Web Audio API.
 *
 * Sound profiles are based on real acoustic differences:
 * - Deep tube lines (Piccadilly, Northern, Central, Victoria, Bakerloo, Jubilee)
 *   have more rumble and resonance from narrow circular tunnels
 * - Sub-surface lines (Circle, District, Metropolitan, Hammersmith)
 *   are more open with less bass buildup
 * - Newer trains (Victoria, Elizabeth, Jubilee) have smoother motor whine
 * - Older stock (Bakerloo) has more rattle and mechanical noise
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
        this.audioCtx = null;
        this.currentNodes = [];
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    stop() {
        this.currentNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) { /* already stopped */ }
        });
        this.currentNodes = [];
    }

    /**
     * Play a tube line's sound for a given duration
     */
    play(lineId, duration = 4) {
        this.init();
        this.stop();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const end = now + duration;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.5, now + 0.3);
        masterGain.gain.setValueAtTime(0.5, end - 0.5);
        masterGain.gain.linearRampToValueAtTime(0, end);
        masterGain.connect(ctx.destination);
        this.currentNodes.push(masterGain);

        const synth = this[`_${lineId}`];
        if (synth) {
            synth.call(this, ctx, masterGain, now, end, duration);
        }

        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    // --- Helper methods ---

    _createNoise(ctx, duration) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        this.currentNodes.push(source);
        return source;
    }

    _createOsc(ctx, type, freq, end) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.start();
        osc.stop(end);
        this.currentNodes.push(osc);
        return osc;
    }

    _createFilter(ctx, type, freq, q) {
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        if (q !== undefined) filter.Q.value = q;
        this.currentNodes.push(filter);
        return filter;
    }

    // --- Line-specific sound profiles ---

    _bakerloo(ctx, output, now, end, dur) {
        // Old 1972 stock: heavy rattle, deep rumble, mechanical clatter
        const noise = this._createNoise(ctx, dur);
        const lp = this._createFilter(ctx, 'lowpass', 200, 2);
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.7;
        noise.connect(lp).connect(noiseGain).connect(output);
        noise.start();

        // Rattle effect - amplitude modulation
        const rattleOsc = this._createOsc(ctx, 'square', 13, end);
        const rattleGain = ctx.createGain();
        rattleGain.gain.value = 0.25;
        rattleOsc.connect(rattleGain).connect(noiseGain.gain);

        // Low motor drone
        const motor = this._createOsc(ctx, 'sawtooth', 55, end);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.15;
        const motorFilter = this._createFilter(ctx, 'lowpass', 120, 3);
        motor.connect(motorFilter).connect(motorGain).connect(output);

        // Clattering rhythm
        const clatter = this._createOsc(ctx, 'square', 7.5, end);
        const clatterGain = ctx.createGain();
        clatterGain.gain.value = 0.08;
        const clatterBP = this._createFilter(ctx, 'bandpass', 800, 5);
        const clatterNoise = this._createNoise(ctx, dur);
        clatterNoise.connect(clatterBP);
        clatterGain.gain.value = 0;
        clatter.connect(clatterGain);
        clatterBP.connect(output);
        clatterNoise.start();
    }

    _central(ctx, output, now, end, dur) {
        // 1992 stock: high-pitched whine, strong tunnel resonance
        const whine = this._createOsc(ctx, 'sawtooth', 420, end);
        const whineGain = ctx.createGain();
        whineGain.gain.value = 0.08;
        const whineBP = this._createFilter(ctx, 'bandpass', 450, 8);
        whine.connect(whineBP).connect(whineGain).connect(output);

        // Frequency sweep on acceleration
        whine.frequency.setValueAtTime(320, now);
        whine.frequency.linearRampToValueAtTime(520, now + dur * 0.4);
        whine.frequency.setValueAtTime(520, now + dur * 0.6);
        whine.frequency.linearRampToValueAtTime(380, end);

        // Tunnel resonance
        const noise = this._createNoise(ctx, dur);
        const resonance = this._createFilter(ctx, 'bandpass', 180, 4);
        const resGain = ctx.createGain();
        resGain.gain.value = 0.4;
        noise.connect(resonance).connect(resGain).connect(output);
        noise.start();

        // Deep rumble
        const rumble = this._createOsc(ctx, 'sine', 60, end);
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.value = 0.15;
        rumble.connect(rumbleGain).connect(output);
    }

    _circle(ctx, output, now, end, dur) {
        // S-stock: airy, open, gentle electric hum
        const hum = this._createOsc(ctx, 'sine', 150, end);
        const humGain = ctx.createGain();
        humGain.gain.value = 0.12;
        hum.connect(humGain).connect(output);

        // Light air noise (open sections)
        const air = this._createNoise(ctx, dur);
        const airHP = this._createFilter(ctx, 'highpass', 2000, 1);
        const airGain = ctx.createGain();
        airGain.gain.value = 0.15;
        air.connect(airHP).connect(airGain).connect(output);
        air.start();

        // Gentle motor tone
        const motor = this._createOsc(ctx, 'triangle', 220, end);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.06;
        motor.connect(motorGain).connect(output);

        // Rhythmic rail click (lighter)
        const click = this._createOsc(ctx, 'sine', 5.5, end);
        const clickGain = ctx.createGain();
        clickGain.gain.value = 0.04;
        click.connect(clickGain).connect(output);
    }

    _district(ctx, output, now, end, dur) {
        // S-stock but with more tunnel sections: moderate rumble
        const noise = this._createNoise(ctx, dur);
        const lp = this._createFilter(ctx, 'lowpass', 350, 2);
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.3;
        noise.connect(lp).connect(noiseGain).connect(output);
        noise.start();

        // Motor hum
        const motor = this._createOsc(ctx, 'triangle', 185, end);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.1;
        motor.connect(motorGain).connect(output);

        // Rail joints
        const joints = this._createOsc(ctx, 'sine', 8, end);
        const jointsGain = ctx.createGain();
        jointsGain.gain.value = 0.06;
        const jointNoise = this._createNoise(ctx, dur);
        const jointBP = this._createFilter(ctx, 'bandpass', 600, 3);
        jointNoise.connect(jointBP).connect(jointsGain).connect(output);
        jointNoise.start();

        // Subtle second harmonic
        const h2 = this._createOsc(ctx, 'sine', 370, end);
        const h2Gain = ctx.createGain();
        h2Gain.gain.value = 0.03;
        h2.connect(h2Gain).connect(output);
    }

    _hammersmith(ctx, output, now, end, dur) {
        // Lightest sub-surface sound, most open sections
        const air = this._createNoise(ctx, dur);
        const airHP = this._createFilter(ctx, 'highpass', 2500, 0.8);
        const airGain = ctx.createGain();
        airGain.gain.value = 0.18;
        air.connect(airHP).connect(airGain).connect(output);
        air.start();

        // Very light hum
        const hum = this._createOsc(ctx, 'sine', 165, end);
        const humGain = ctx.createGain();
        humGain.gain.value = 0.08;
        hum.connect(humGain).connect(output);

        // Door beep-like tone (distinctive)
        const beep = this._createOsc(ctx, 'sine', 880, end);
        const beepGain = ctx.createGain();
        beepGain.gain.value = 0.0;
        beep.connect(beepGain).connect(output);
        // Short beeps
        for (let t = 0.5; t < dur - 1; t += 1.8) {
            beepGain.gain.setValueAtTime(0, now + t);
            beepGain.gain.linearRampToValueAtTime(0.04, now + t + 0.05);
            beepGain.gain.linearRampToValueAtTime(0, now + t + 0.15);
        }

        // Light rattle
        const rattle = this._createNoise(ctx, dur);
        const rattleBP = this._createFilter(ctx, 'bandpass', 1200, 2);
        const rattleGain = ctx.createGain();
        rattleGain.gain.value = 0.06;
        rattle.connect(rattleBP).connect(rattleGain).connect(output);
        rattle.start();
    }

    _jubilee(ctx, output, now, end, dur) {
        // 1996 stock: smooth modern motor, deep bass, platform screen door chime
        const bass = this._createOsc(ctx, 'sine', 45, end);
        const bassGain = ctx.createGain();
        bassGain.gain.value = 0.2;
        bass.connect(bassGain).connect(output);

        // Smooth motor whine with sweep
        const motor = this._createOsc(ctx, 'sawtooth', 200, end);
        const motorBP = this._createFilter(ctx, 'bandpass', 280, 6);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.07;
        motor.connect(motorBP).connect(motorGain).connect(output);
        motor.frequency.setValueAtTime(180, now);
        motor.frequency.linearRampToValueAtTime(340, now + dur * 0.5);
        motor.frequency.linearRampToValueAtTime(260, end);

        // Tunnel wind
        const wind = this._createNoise(ctx, dur);
        const windBP = this._createFilter(ctx, 'bandpass', 300, 1.5);
        const windGain = ctx.createGain();
        windGain.gain.value = 0.2;
        wind.connect(windBP).connect(windGain).connect(output);
        wind.start();

        // Low rumble
        const rumble = this._createNoise(ctx, dur);
        const rumbleLP = this._createFilter(ctx, 'lowpass', 80, 2);
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.value = 0.25;
        rumble.connect(rumbleLP).connect(rumbleGain).connect(output);
        rumble.start();
    }

    _metropolitan(ctx, output, now, end, dur) {
        // S-stock on longer runs: spacious, rhythmic clatter, echo
        const noise = this._createNoise(ctx, dur);
        const lp = this._createFilter(ctx, 'lowpass', 400, 1);
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.2;
        noise.connect(lp).connect(noiseGain).connect(output);
        noise.start();

        // Rhythmic joint clatter (wider spacing = lower frequency)
        const clatter = this._createNoise(ctx, dur);
        const clatterBP = this._createFilter(ctx, 'bandpass', 500, 4);
        const clatterGain = ctx.createGain();
        clatterGain.gain.value = 0;
        clatter.connect(clatterBP).connect(clatterGain).connect(output);
        clatter.start();
        // Rhythmic pulse
        for (let t = 0; t < dur; t += 0.6) {
            clatterGain.gain.setValueAtTime(0.02, now + t);
            clatterGain.gain.linearRampToValueAtTime(0.12, now + t + 0.05);
            clatterGain.gain.linearRampToValueAtTime(0.02, now + t + 0.3);
        }

        // Motor hum
        const motor = this._createOsc(ctx, 'triangle', 195, end);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.08;
        motor.connect(motorGain).connect(output);

        // Spacious resonance
        const res = this._createOsc(ctx, 'sine', 110, end);
        const resGain = ctx.createGain();
        resGain.gain.value = 0.06;
        res.connect(resGain).connect(output);
    }

    _northern(ctx, output, now, end, dur) {
        // Intense low roar, curve screech, deepest sections
        const roar = this._createNoise(ctx, dur);
        const roarLP = this._createFilter(ctx, 'lowpass', 150, 3);
        const roarGain = ctx.createGain();
        roarGain.gain.value = 0.6;
        roar.connect(roarLP).connect(roarGain).connect(output);
        roar.start();

        // Curve screech
        const screech = this._createOsc(ctx, 'sawtooth', 1800, end);
        const screechBP = this._createFilter(ctx, 'bandpass', 2000, 12);
        const screechGain = ctx.createGain();
        screechGain.gain.value = 0;
        screech.connect(screechBP).connect(screechGain).connect(output);
        // Intermittent screech
        screechGain.gain.setValueAtTime(0, now + dur * 0.3);
        screechGain.gain.linearRampToValueAtTime(0.04, now + dur * 0.35);
        screechGain.gain.linearRampToValueAtTime(0, now + dur * 0.5);
        screechGain.gain.setValueAtTime(0, now + dur * 0.65);
        screechGain.gain.linearRampToValueAtTime(0.03, now + dur * 0.7);
        screechGain.gain.linearRampToValueAtTime(0, now + dur * 0.8);

        // Deep tunnel resonance
        const res = this._createOsc(ctx, 'sine', 40, end);
        const resGain = ctx.createGain();
        resGain.gain.value = 0.18;
        res.connect(resGain).connect(output);

        // Motor
        const motor = this._createOsc(ctx, 'sawtooth', 85, end);
        const motorLP = this._createFilter(ctx, 'lowpass', 200, 2);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.1;
        motor.connect(motorLP).connect(motorGain).connect(output);
    }

    _piccadilly(ctx, output, now, end, dur) {
        // 1973 stock: distinctive drone, tunnel amplification
        const drone = this._createOsc(ctx, 'sawtooth', 130, end);
        const droneBP = this._createFilter(ctx, 'bandpass', 160, 5);
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.12;
        drone.connect(droneBP).connect(droneGain).connect(output);

        // Second harmonic
        const h2 = this._createOsc(ctx, 'sawtooth', 260, end);
        const h2Gain = ctx.createGain();
        h2Gain.gain.value = 0.05;
        const h2BP = this._createFilter(ctx, 'bandpass', 280, 6);
        h2.connect(h2BP).connect(h2Gain).connect(output);

        // Tunnel amplification (resonant noise)
        const tunnel = this._createNoise(ctx, dur);
        const tunnelBP = this._createFilter(ctx, 'bandpass', 250, 3);
        const tunnelGain = ctx.createGain();
        tunnelGain.gain.value = 0.3;
        tunnel.connect(tunnelBP).connect(tunnelGain).connect(output);
        tunnel.start();

        // Low rumble
        const rumble = this._createOsc(ctx, 'sine', 50, end);
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.value = 0.12;
        rumble.connect(rumbleGain).connect(output);

        // Acceleration sweep
        drone.frequency.setValueAtTime(100, now);
        drone.frequency.linearRampToValueAtTime(160, now + dur * 0.4);
        drone.frequency.setValueAtTime(160, end - dur * 0.3);
        drone.frequency.linearRampToValueAtTime(110, end);
    }

    _victoria(ctx, output, now, end, dur) {
        // 2009 stock: clean electric, fast acceleration whine, modern
        const whine = this._createOsc(ctx, 'sine', 300, end);
        const whineGain = ctx.createGain();
        whineGain.gain.value = 0.1;
        whine.connect(whineGain).connect(output);
        // Fast acceleration sweep
        whine.frequency.setValueAtTime(200, now);
        whine.frequency.exponentialRampToValueAtTime(600, now + dur * 0.3);
        whine.frequency.exponentialRampToValueAtTime(500, now + dur * 0.5);
        whine.frequency.setValueAtTime(500, end - dur * 0.3);
        whine.frequency.exponentialRampToValueAtTime(250, end);

        // Clean hum
        const hum = this._createOsc(ctx, 'triangle', 120, end);
        const humGain = ctx.createGain();
        humGain.gain.value = 0.08;
        hum.connect(humGain).connect(output);

        // Very light tunnel noise
        const tunnel = this._createNoise(ctx, dur);
        const tunnelLP = this._createFilter(ctx, 'lowpass', 250, 1);
        const tunnelGain = ctx.createGain();
        tunnelGain.gain.value = 0.15;
        tunnel.connect(tunnelLP).connect(tunnelGain).connect(output);
        tunnel.start();

        // IGBT inverter tone (distinctive modern train sound)
        const igbt = this._createOsc(ctx, 'square', 700, end);
        const igbtBP = this._createFilter(ctx, 'bandpass', 700, 15);
        const igbtGain = ctx.createGain();
        igbtGain.gain.value = 0.02;
        igbt.connect(igbtBP).connect(igbtGain).connect(output);
        igbt.frequency.setValueAtTime(400, now);
        igbt.frequency.exponentialRampToValueAtTime(900, now + dur * 0.3);
        igbt.frequency.setValueAtTime(900, now + dur * 0.5);
        igbt.frequency.exponentialRampToValueAtTime(500, end);
    }

    _elizabeth(ctx, output, now, end, dur) {
        // Aventra trains: very quiet, modern, smooth acceleration
        const motor = this._createOsc(ctx, 'sine', 180, end);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.06;
        motor.connect(motorGain).connect(output);
        motor.frequency.setValueAtTime(140, now);
        motor.frequency.linearRampToValueAtTime(220, now + dur * 0.5);
        motor.frequency.linearRampToValueAtTime(180, end);

        // Very quiet air
        const air = this._createNoise(ctx, dur);
        const airHP = this._createFilter(ctx, 'highpass', 3000, 0.5);
        const airGain = ctx.createGain();
        airGain.gain.value = 0.08;
        air.connect(airHP).connect(airGain).connect(output);
        air.start();

        // Gentle low hum
        const hum = this._createOsc(ctx, 'sine', 60, end);
        const humGain = ctx.createGain();
        humGain.gain.value = 0.07;
        hum.connect(humGain).connect(output);

        // Smooth IGBT (quieter, more refined than Victoria)
        const igbt = this._createOsc(ctx, 'triangle', 500, end);
        const igbtGain = ctx.createGain();
        igbtGain.gain.value = 0.03;
        const igbtBP = this._createFilter(ctx, 'bandpass', 500, 10);
        igbt.connect(igbtBP).connect(igbtGain).connect(output);
        igbt.frequency.setValueAtTime(350, now);
        igbt.frequency.linearRampToValueAtTime(600, now + dur * 0.4);
        igbt.frequency.linearRampToValueAtTime(400, end);
    }

    _waterloo(ctx, output, now, end, dur) {
        // 1992 stock in a very short enclosed tunnel
        const noise = this._createNoise(ctx, dur);
        const lp = this._createFilter(ctx, 'lowpass', 280, 3);
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.35;
        noise.connect(lp).connect(noiseGain).connect(output);
        noise.start();

        // Enclosed resonance (tight tunnel)
        const res1 = this._createOsc(ctx, 'sine', 95, end);
        const res1Gain = ctx.createGain();
        res1Gain.gain.value = 0.15;
        res1.connect(res1Gain).connect(output);

        const res2 = this._createOsc(ctx, 'sine', 190, end);
        const res2Gain = ctx.createGain();
        res2Gain.gain.value = 0.06;
        res2.connect(res2Gain).connect(output);

        // Motor whine (1992 stock)
        const motor = this._createOsc(ctx, 'sawtooth', 350, end);
        const motorBP = this._createFilter(ctx, 'bandpass', 380, 7);
        const motorGain = ctx.createGain();
        motorGain.gain.value = 0.06;
        motor.connect(motorBP).connect(motorGain).connect(output);
        motor.frequency.setValueAtTime(280, now);
        motor.frequency.linearRampToValueAtTime(420, now + dur * 0.4);
        motor.frequency.linearRampToValueAtTime(320, end);
    }
}
