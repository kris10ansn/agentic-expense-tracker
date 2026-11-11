import { useCallback, useEffect, useState } from "react";
import { createSubscriptions } from "../util/createSubscriptions";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeech = ({
  onResults,
  onError,
}: {
  onError?: (error: { message: string }) => void;
  onResults: (results: SpeechRecognitionResultList) => void;
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
      result: ({ results }) => onResults(results),
      error: (error) => onError?.(error),
      start: () => setIsRecording(true),
      end: () => setIsRecording(false),
    });
  }, [speech, onError, onResults]);

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

export const createTranscript = (results: SpeechRecognitionResultList) =>
  Array.from(results)
    .map((result) => result[0]?.transcript ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1");
