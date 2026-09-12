"use client";
import { useState, useTransition } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteOpportunity } from "@/app/actions";
import { Button } from "./ui/button";

export function DeleteOpportunity({ id, redirectAfter = false }: { id: string; redirectAfter?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  function remove() {
    setError("");
    startTransition(async () => {
      try {
        const result = await deleteOpportunity(id);
        if (result.error) { setError(result.error); toast.error(result.error); return; }
        toast.success("Opportunity deleted."); setOpen(false);
        if (redirectAfter) router.push("/my-opportunities");
        router.refresh();
      } catch { setError("We couldn’t delete this right now. Please try again."); }
    });
  }
  return <AlertDialog.Root open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}><AlertDialog.Trigger asChild><Button variant="ghost" className="!text-[#b55a66]"><Trash2 size={14} />Delete</Button></AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="dialog-content"><div className="mb-5 inline-flex rounded-xl bg-red-50 p-3 text-red-700"><Trash2 size={22} /></div><AlertDialog.Title className="text-xl font-semibold tracking-tight">Delete this opportunity?</AlertDialog.Title><AlertDialog.Description className="mt-3 text-sm leading-7 text-muted">This action cannot be undone. Your opportunity will be permanently removed from CampusConnect.</AlertDialog.Description>{error && <p role="alert" className="mt-4 text-xs text-red-800">{error}</p>}<div className="mt-7 flex justify-end gap-3"><AlertDialog.Cancel asChild><Button variant="secondary" disabled={pending}>Keep opportunity</Button></AlertDialog.Cancel><Button variant="danger" onClick={remove} disabled={pending}>{pending && <Loader2 size={15} className="animate-spin" />}{pending ? "Deleting…" : "Delete opportunity"}</Button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>;
}
