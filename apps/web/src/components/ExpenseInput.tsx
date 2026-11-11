import { useCallback } from "react";
import { Button, TextArea } from "./inputs";
import { Spinner } from "./Spinner";
import { VoiceButton } from "./VoiceButton";

export type ExpenseInputProps = {
  onSubmit: (text: string) => unknown;
  fetching: boolean;
  disabled?: boolean;
  value: string;
  setValue: (value: string) => void;
};

export function ExpenseInput({
  onSubmit,
  fetching,
  disabled,
  value,
  setValue,
}: ExpenseInputProps) {
  const action = useCallback(
    (data: FormData) => {
      const text = data.get("text");

      if (text === null || text.toString().length === 0) {
        console.error("ExpenseInput: no text provided!");
        return;
      }

      onSubmit(text.toString());
    },
    [onSubmit],
  );

  return (
    <form className="flex flex-col gap-4" action={action}>
      <TextArea
        name="text"
        placeholder="Describe an expense..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={fetching || disabled}
      />

      <VoiceButton
        onTranscript={(transcript) => setValue(transcript)}
        onError={console.error.bind(null, "voicebutton")}
      />

      <Button
        className="flex flex-row gap-2"
        type="submit"
        disabled={fetching || disabled}
      >
        {fetching && <Spinner />}
        Send
      </Button>
    </form>
  );
}
