import { Trash2 } from "lucide-react";
import { Dialog, DialogActions } from "./Dialog";
import { Button } from "./inputs";

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onClose,
  pending,
  error,
}: {
  pending: boolean;
  error: string;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={title}
      description={description}
      onClose={onClose}
      pending={pending}
    >
      {error && (
        <p role="alert" className="mt-5 text-sm text-red-700">
          {error}
        </p>
      )}
      <DialogActions className="mt-7">
        <Button disabled={pending} variant="secondary" onClick={onClose}>
          Keep it
        </Button>
        <Button disabled={pending} variant="danger" onClick={onConfirm}>
          <Trash2 className="size-4" />
          Delete permanently
        </Button>
      </DialogActions>
    </Dialog>
  );
}
