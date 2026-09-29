import { useEffect, useState } from "react";
import { FaPlay, FaStop } from "react-icons/fa6";
import {
  lineAudioKey,
  loadAudioManifest,
  projectSlug,
} from "~/lib/lineAudio";

let activeAudio: HTMLAudioElement | null = null;

interface LineAudioButtonProps {
  projectName: string;
  characters: string[];
  text: string;
}

export const LineAudioButton = ({
  projectName,
  characters,
  text,
}: LineAudioButtonProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const character = characters.length === 1 ? characters[0] : undefined;

  useEffect(() => {
    if (!character) return;
    let cancelled = false;
    const slug = projectSlug(projectName);
    void Promise.all([
      loadAudioManifest(slug),
      lineAudioKey(character, text),
    ]).then(([manifest, key]) => {
      const file = manifest[key];
      if (!cancelled && file) setSrc(`/sceneData/audio/${slug}/${file}`);
    });
    return () => {
      cancelled = true;
    };
  }, [projectName, character, text]);

  if (!src) return null;

  const toggle = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
      if (playing) return;
    }
    const audio = new Audio(src);
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    activeAudio = audio;
    setPlaying(true);
    void audio.play().catch(() => setPlaying(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Stop line audio" : "Play line audio"}
      className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full border border-border text-[0.7em] text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
    >
      {playing ? <FaStop /> : <FaPlay />}
    </button>
  );
};
