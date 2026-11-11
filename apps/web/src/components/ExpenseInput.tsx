import { Mic } from "lucide-react";
import { useCallback } from "react";
import { Button, TextInput } from "./inputs";
import { Spinner } from "./Spinner";

export type ExpenseInputProps = {
  onSubmit: (text: string) => unknown;
  fetching: boolean;
  disabled?: boolean;
};

export function ExpenseInput({
  onSubmit,
  fetching,
  disabled,
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
    <form className="flex flex-row gap-4" action={action}>
      <TextInput
        name="text"
        placeholder="Describe an expense..."
        disabled={fetching || disabled}
      />
      <Button variant="secondary">
        <Mic />
      </Button>

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
