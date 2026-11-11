import { useCallback, useEffect, useState } from "react";
import { createSubscriptions } from "../util/createSubscriptions";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeech = ({
  onTranscript,
  onError,
}: {
  onError?: (error: { message: string }) => void;
  onTranscript: (transcript: string) => void;
}) => {
  const [speech] = useState(() => {
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = true;

    return recognition;
  });

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<{
    message: string;
  } | null>(null);

  const startRecording = useCallback(() => {
    speech.start();
    setError(null);
    setIsRecording(true);
  }, [speech.start]);

  const stopRecording = useCallback(() => {
    speech.stop();
    setIsRecording(false);
  }, [speech.stop]);

  useEffect(() => {
    return createSubscriptions(speech, {
      result: (event) => {
        const transcript = event.results[0]?.[0]?.transcript;

        if (!transcript) {
          onError?.({ message: "No transcript!" });
          return;
        }

        onTranscript(transcript);
      },
      error: (error) => onError?.(error),
      start: () => setIsRecording(true),
      end: () => setIsRecording(false),
      audiostart: console.log.bind(null, "audiostart"),
      audioend: console.log.bind(null, "audioend"),
      soundstart: console.log.bind(null, "soundstart"),
      soundend: console.log.bind(null, "soundend"),
      speechstart: console.log.bind(null, "speechstart"),
      speechend: console.log.bind(null, "speechend"),
      nomatch: console.log.bind(null, "nomatch"),
    });
  }, [speech, onError, onTranscript]);

  if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
    return { isSupported: false } as const;
  }

  return {
    isSupported: true,
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
};
