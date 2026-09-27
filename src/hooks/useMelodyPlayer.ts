"use client";

import type * as ToneNS from "tone";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  noteStartBeats,
  totalBeats,
  transpose,
  type Melody,
  type MelodyNote,
} from "~/lib/melody";

type ToneModule = typeof ToneNS;
type Sampler = InstanceType<ToneModule["Sampler"]>;

export interface NoteRange {
  start: number; // first note index
  end: number; // last note index, inclusive
}

// Salamander subset in public/audio/piano, every minor third A1–C7
const SAMPLE_URLS: Record<string, string> = Object.fromEntries(
  ["A1", "C2", "Ds2", "Fs2", "A2", "C3", "Ds3", "Fs3", "A3", "C4", "Ds4", "Fs4", "A4", "C5", "Ds5", "Fs5", "A5", "C6", "Ds6", "Fs6", "A6", "C7"].map(
    (f) => [f.replace("s", "#"), `${f}.mp3`],
  ),
);
const SAMPLE_BASE_URL = "/audio/piano/";
const RELEASE_FRACTION = 0.9;
const TAIL_SECONDS = 1.5;

interface ScheduledNote {
  index: number;
  startBeat: number;
  pitch: string | null; // null = rest or tied continuation (no attack)
  soundingBeats: number; // tied chains merged into one attack
}

/** One attack per untied note or tie chain; every note still gets a highlight slot */
export const buildSchedule = (notes: MelodyNote[]): ScheduledNote[] => {
  const starts = noteStartBeats(notes);
  return notes.map((note, i) => {
    const prev = notes[i - 1];
    const continuesTie = !!prev?.tieToNext && prev.pitch === note.pitch;
    if (note.pitch === null || continuesTie) {
      return { index: i, startBeat: starts[i]!, pitch: null, soundingBeats: 0 };
    }
    let beats = note.beats;
    for (let j = i; notes[j]?.tieToNext && notes[j + 1]?.pitch === note.pitch; j++) {
      beats += notes[j + 1]!.beats;
    }
    return { index: i, startBeat: starts[i]!, pitch: note.pitch, soundingBeats: beats };
  });
};

const createSampler = (Tone: ToneModule): Promise<Sampler> =>
  new Promise((resolve, reject) => {
    const sampler: Sampler = new Tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: SAMPLE_BASE_URL,
      release: 1,
      onload: () => resolve(sampler),
      onerror: (err) => reject(err),
    }).toDestination();
  });

export function useMelodyPlayer(melody: Pick<Melody, "notes" | "tempoBpm"> | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [tempoScale, setTempoScale] = useState(1);
  const [octaveShift, setOctaveShift] = useState(0);
  const [loop, setLoopState] = useState<NoteRange | null>(null);

  const toneRef = useRef<ToneModule | null>(null);
  const samplerRef = useRef<Sampler | null>(null);
  const octaveRef = useRef(octaveShift);
  const melodyRef = useRef(melody);
  const loopRef = useRef(loop);
  const pausedRef = useRef(false);
  octaveRef.current = octaveShift;
  melodyRef.current = melody;
  loopRef.current = loop;

  const ensureReady = useCallback(async () => {
    if (!toneRef.current) toneRef.current = await import("tone");
    const Tone = toneRef.current;
    await Tone.start();
    if (!samplerRef.current) {
      setIsLoading(true);
      try {
        samplerRef.current = await createSampler(Tone);
      } finally {
        setIsLoading(false);
      }
    }
    return Tone;
  }, []);

  const applyLoop = useCallback((Tone: ToneModule, range: NoteRange | null) => {
    const transport = Tone.getTransport();
    const notes = melodyRef.current?.notes ?? [];
    if (!range || notes.length === 0) {
      transport.loop = false;
      return;
    }
    const starts = noteStartBeats(notes);
    const ppq = transport.PPQ;
    const end = Math.min(range.end, notes.length - 1);
    transport.loopStart = `${Math.round(starts[range.start]! * ppq)}i`;
    transport.loopEnd = `${Math.round((starts[end]! + notes[end]!.beats) * ppq)}i`;
    transport.loop = true;
  }, []);

  /** (Re)schedule every note on the Transport; ticks keep it tempo-independent */
  const schedule = useCallback((Tone: ToneModule) => {
    const transport = Tone.getTransport();
    const draw = Tone.getDraw();
    transport.cancel(0);
    const m = melodyRef.current;
    if (!m) return;
    const ppq = transport.PPQ;
    for (const ev of buildSchedule(m.notes)) {
      transport.schedule((time) => {
        const sampler = samplerRef.current;
        if (ev.pitch && sampler) {
          const pitch = transpose(ev.pitch, octaveRef.current * 12);
          const dur = `${Math.max(1, Math.round(ev.soundingBeats * RELEASE_FRACTION * ppq))}i`;
          sampler.triggerAttackRelease(pitch, dur, time);
        }
        draw.schedule(() => setCurrentNoteIndex(ev.index), time);
      }, `${Math.round(ev.startBeat * ppq)}i`);
    }
    // Stop at the end of the melody (a loop never reaches it)
    transport.schedule((time) => {
      if (loopRef.current) return;
      draw.schedule(() => {
        transport.stop();
        pausedRef.current = false;
        setIsPlaying(false);
        setCurrentNoteIndex(-1);
      }, time);
    }, `${Math.round(totalBeats(m.notes) * ppq)}i`);
  }, []);

  const play = useCallback(
    async (fromNoteIndex?: number) => {
      const m = melodyRef.current;
      if (!m || m.notes.length === 0) return;
      const Tone = await ensureReady();
      const transport = Tone.getTransport();
      transport.bpm.value = m.tempoBpm * tempoScale;
      schedule(Tone);
      applyLoop(Tone, loopRef.current);

      if (fromNoteIndex === undefined && pausedRef.current) {
        transport.start();
      } else {
        const starts = noteStartBeats(m.notes);
        let from = fromNoteIndex ?? loopRef.current?.start ?? 0;
        // Starting outside the loop would never reach it; jump in
        const range = loopRef.current;
        if (range && (from < range.start || from > range.end)) from = range.start;
        transport.stop();
        samplerRef.current?.releaseAll();
        transport.ticks = Math.round(starts[from]! * transport.PPQ);
        transport.start();
      }
      pausedRef.current = false;
      setIsPlaying(true);
    },
    [ensureReady, schedule, applyLoop, tempoScale],
  );

  const pause = useCallback(() => {
    const Tone = toneRef.current;
    if (!Tone) return;
    Tone.getTransport().pause();
    samplerRef.current?.releaseAll();
    pausedRef.current = true;
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const Tone = toneRef.current;
    if (Tone) Tone.getTransport().stop();
    samplerRef.current?.releaseAll();
    pausedRef.current = false;
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
  }, []);

  const setLoop = useCallback(
    (range: NoteRange | null) => {
      setLoopState(range);
      loopRef.current = range;
      if (toneRef.current) applyLoop(toneRef.current, range);
    },
    [applyLoop],
  );

  // Live tempo changes: events are in ticks, so only the BPM needs to move
  useEffect(() => {
    const Tone = toneRef.current;
    if (Tone && melody) Tone.getTransport().bpm.value = melody.tempoBpm * tempoScale;
  }, [tempoScale, melody]);

  // Edits while playing: reschedule in place
  useEffect(() => {
    const Tone = toneRef.current;
    if (Tone && melody && Tone.getTransport().state !== "stopped") {
      schedule(Tone);
      applyLoop(Tone, loopRef.current);
    }
  }, [melody, schedule, applyLoop]);

  useEffect(() => {
    return () => {
      const Tone = toneRef.current;
      if (Tone) {
        const transport = Tone.getTransport();
        transport.stop();
        transport.cancel(0);
        transport.loop = false;
      }
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, []);

  return {
    play,
    pause,
    stop,
    isPlaying,
    currentNoteIndex,
    tempoScale,
    setTempoScale,
    octaveShift,
    setOctaveShift,
    loop,
    setLoop,
    isLoading,
  };
}

/** Render the melody to a 16-bit PCM WAV in the browser */
export async function renderWav(
  melody: Pick<Melody, "notes" | "tempoBpm">,
  tempoScale: number,
  octaveShift: number,
): Promise<Blob> {
  const Tone = await import("tone");
  const bpm = melody.tempoBpm * tempoScale;
  const seconds = (totalBeats(melody.notes) * 60) / bpm + TAIL_SECONDS;

  const buffer = await Tone.Offline(async ({ transport }) => {
    const sampler = await createSampler(Tone);
    transport.bpm.value = bpm;
    const ppq = transport.PPQ;
    for (const ev of buildSchedule(melody.notes)) {
      if (!ev.pitch) continue;
      const pitch = transpose(ev.pitch, octaveShift * 12);
      const dur = `${Math.max(1, Math.round(ev.soundingBeats * RELEASE_FRACTION * ppq))}i`;
      transport.schedule((time) => {
        sampler.triggerAttackRelease(pitch, dur, time);
      }, `${Math.round(ev.startBeat * ppq)}i`);
    }
    transport.start(0);
  }, seconds);

  const audio = buffer.get();
  if (!audio) throw new Error("Rendering produced no audio");
  return encodeWav(audio);
}

const encodeWav = (audio: AudioBuffer): Blob => {
  const channels = audio.numberOfChannels;
  const frames = audio.length;
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const data = Array.from({ length: channels }, (_, c) => audio.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c]![i]!));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
};
