export type PendingExpenseImage = {
  id: string;
  src: string;
  name: string;
  alt: string;
};

export type PendingCapture = {
  id: string;
  collectionId: string;
  description: string;
  images: File[];
};
