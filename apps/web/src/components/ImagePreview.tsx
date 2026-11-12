import { X } from "lucide-react";
import { type MouseEventHandler, useCallback } from "react";

export type ImagePreviewProps = {
  file: File;
  removeFile: (file: File) => void;
};
export const ImagePreview = ({ file, removeFile }: ImagePreviewProps) => {
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
        className="absolute -top-2 -right-2 flex h-7 w-7 cursor-pointer rounded-full border-3 border-gray-200 bg-white p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200"
        type="button"
        onClick={handleRemoveClick}
      >
        <X className="h-full w-full flex-1 text-gray-800" strokeWidth={3} />
      </button>
      <img
        ref={imageRef}
        className="h-24 w-24 flex-1 rounded-xl border-2 border-gray-200 bg-gray-200 object-cover"
        src={URL.createObjectURL(file)}
        alt={file.name}
      />
    </div>
  );
};
