export type PendingExpenseImage = {
  id: string;
  src: string;
  name: string;
  alt: string;
};

export type PendingExpenseInput =
  | { kind: "text"; description: string }
  | {
      kind: "images";
      images: readonly [PendingExpenseImage, ...PendingExpenseImage[]];
      description?: string;
    };

export type PendingCapture = {
  id: string;
  collectionId: string;
  input: PendingExpenseInput;
};
