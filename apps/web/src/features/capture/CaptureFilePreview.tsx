import { useCallback } from "react";

export function CaptureFilePreview({ file }: { file: File }) {
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) return;

      const url = URL.createObjectURL(file);
      image.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  return (
    <li className="flex min-w-0 items-center gap-2.5">
      <img
        ref={imageRef}
        key={file.name}
        alt={file.name}
        className="h-12 w-10 shrink-0 rounded-md border border-neutral-200 object-cover object-top"
      />
      <div className="min-w-0">
        <p
          title={file.name}
          className="truncate text-xs font-medium text-neutral-800"
        >
          {file.name}
        </p>
      </div>
    </li>
  );
}
