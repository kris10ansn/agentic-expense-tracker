import { X } from "lucide-react";
import { type MouseEventHandler, useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";

export type ImagePreviewProps = {
  file: File;
  removeFile: (file: File) => void;
};
export const ImagePreview = ({ file, removeFile }: ImagePreviewProps) => {
  const [showRemove, setShowRemove] = useState(false);
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) {
        return;
      }

      const url = URL.createObjectURL(file);
      image.src = url;

      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  const handleRemoveClick = useCallback<MouseEventHandler>(() => {
    removeFile(file);
  }, [file, removeFile]);

  return (
    <div className="group relative flex">
      <button
        className="flex cursor-pointer rounded-xl"
        type="button"
        aria-label={`Toggle remove button for ${file.name}`}
        aria-expanded={showRemove}
        onClick={() => setShowRemove((visible) => !visible)}
      >
        <img
          ref={imageRef}
          className="h-24 w-24 flex-1 rounded-xl border-2 border-gray-200 bg-gray-200 object-cover"
          src={URL.createObjectURL(file)}
          alt={file.name}
        />
      </button>
      <button
        className={twMerge(
          "invisible absolute -top-2 -right-2 flex h-7 w-7 cursor-pointer rounded-full border-3 border-gray-200 bg-white p-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 hover:bg-gray-200",
          showRemove && "visible opacity-100",
        )}
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={handleRemoveClick}
      >
        <X className="h-full w-full flex-1 text-gray-800" strokeWidth={3} />
      </button>
    </div>
  );
};
