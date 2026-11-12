import { Trash2 } from "lucide-react";
import { Button } from "../inputs";
import { Dialog, DialogActions } from "./Dialog";

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog title={title} description={description} onClose={onClose}>
      <DialogActions className="mt-7">
        <Button variant="secondary" onClick={onClose}>
          Keep it
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          <Trash2 className="size-4" />
          Delete permanently
        </Button>
      </DialogActions>
    </Dialog>
  );
}
