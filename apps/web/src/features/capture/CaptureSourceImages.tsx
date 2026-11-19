import { CaptureFilePreview } from "./CaptureFilePreview";

export function CaptureSourceImages({
  sourceImageIds,
  fileNames,
  files,
}: {
  sourceImageIds: string[] | undefined;
  fileNames: string[];
  files: File[];
}) {
  if (!sourceImageIds?.length) {
    return null;
  }

  return (
    <ul aria-label="Source images" className="mt-2 space-y-2">
      {fileNames.map((fileName, index) => {
        const id = `image-${index + 1}`;
        if (!sourceImageIds.includes(id)) {
          return null;
        }

        return (
          <CaptureFilePreview
            key={id}
            file={files[index]}
            fileName={fileName}
            imageNumber={index + 1}
          />
        );
      })}
    </ul>
  );
}
