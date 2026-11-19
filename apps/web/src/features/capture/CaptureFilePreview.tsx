import { useCallback } from "react";

export function CaptureFilePreview({
  file,
  fileName,
  imageNumber,
}: {
  file: File | undefined;
  fileName: string;
  imageNumber: number;
}) {
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image || !file) {
        return;
      }

      const url = URL.createObjectURL(file);
      image.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  return (
    <li className="flex min-w-0 items-center gap-2.5">
      {file && (
        <img
          ref={imageRef}
          alt={fileName}
          className="h-12 w-10 shrink-0 rounded-md border border-neutral-200 object-cover object-top"
        />
      )}
      <div className="min-w-0">
        <p
          title={fileName}
          className="truncate text-xs font-medium text-neutral-800"
        >
          {fileName}
        </p>
        <p className="text-xs text-neutral-500">Image {imageNumber}</p>
      </div>
    </li>
  );
}
