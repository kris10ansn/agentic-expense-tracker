import { Mic, MicOff } from "lucide-react";
import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import { useSpeech } from "../hooks/useSpeech";
import { Button } from "./inputs";

export type VoiceButtonProps = {
  onTranscript: (transcript: string) => unknown;
  onError: (error: { message: string }) => unknown;
};

export function VoiceButton({ onTranscript, onError }: VoiceButtonProps) {
  const speech = useSpeech({ onTranscript, onError });

  const onClick = useCallback(() => {
    if (!speech.isSupported) throw new Error("Web Speech API not supported!");

    if (!speech.isRecording) {
      speech.startRecording();
    } else {
      speech.stopRecording();
    }
  }, [speech]);

  return (
    <Button
      variant="secondary"
      disabled={!speech.isSupported}
      className={twMerge(
        "flex flex-1 flex-col outline-0 outline-green-500 transition-[outline-width]",
        speech.error && "outline-2 outline-offset-2 outline-red-500",
        speech.isRecording && "outline-2",
      )}
      onClick={onClick}
      title={
        speech.isSupported
          ? "Start voice recording"
          : "Voice recording is not supported in your browser"
      }
    >
      {speech.isSupported ? <Mic /> : <MicOff className="text-red-600" />}
    </Button>
  );
}
