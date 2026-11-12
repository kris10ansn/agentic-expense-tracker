import { Camera, Image } from "lucide-react";
import { useCallback, useState } from "react";
import { ImagePreview } from "./ImagePreview";
import { Button, FileInputButton, TextArea } from "./inputs";
import { Spinner } from "./Spinner";
import { VoiceButton } from "./VoiceButton";

export type ExpenseInputProps = {
  onSubmit: (text: string, files: File[]) => unknown;
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
  const [files, setFiles] = useState<File[]>([]);

  const action = useCallback(
    (data: FormData) => {
      const text = data.get("text")?.toString().trim() ?? "";

      if (!text && files.length === 0) {
        console.error("ExpenseInput: no input provided!");
        return;
      }

      onSubmit(text.toString(), files);
    },
    [onSubmit, files],
  );

  const handleFileChange = useCallback(
    (list: FileList) => {
      setFiles([...files, ...list]);
    },
    [files],
  );

  const handleRemoveFile = useCallback(
    (file: File) => setFiles(files.filter((f) => f !== file)),
    [files],
  );

  return (
    <form className="flex flex-col gap-4" action={action}>
      <div className="flex flex-row gap-2">
        {files.map((file, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Index will not change
          <ImagePreview file={file} key={index} removeFile={handleRemoveFile} />
        ))}
      </div>

      <TextArea
        name="text"
        placeholder="Describe an expense..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={fetching || disabled}
      />

      <div className="flex flex-row gap-2">
        <FileInputButton
          fileList={files}
          onChange={handleFileChange}
          variant="secondary"
          className="flex-1"
          inputProps={{ accept: "image/*", multiple: true }}
        >
          <Image />
        </FileInputButton>
        <FileInputButton
          fileList={files}
          onChange={handleFileChange}
          variant="secondary"
          className="flex-1"
          inputProps={{
            capture: "environment",
            accept: "image/*",
            multiple: true,
          }}
        >
          <Camera />
        </FileInputButton>
      </div>

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
