import Swal from "sweetalert2";

const base = Swal.mixin({
  background: "#ffffff",
  color: "#0f172a",
  confirmButtonColor: "#06b6d4",
  cancelButtonColor: "#e2e8f0",
  buttonsStyling: true,
  reverseButtons: true,
  customClass: {
    popup: "rounded-2xl shadow-2xl border border-border",
    title: "font-display text-xl font-bold text-navy",
    htmlContainer: "text-sm text-slate-600",
    confirmButton: "px-5 py-2 rounded-md font-semibold text-white",
    cancelButton: "px-5 py-2 rounded-md font-semibold !text-slate-700",
  },
});

export type ConfirmDeleteOpts = {
  title?: string;
  itemLabel: string;
  description?: string;
  confirmText?: string;
  typeToConfirm?: boolean;
};

export async function confirmDelete(opts: ConfirmDeleteOpts): Promise<boolean> {
  const {
    title = "Delete this item?",
    itemLabel,
    description,
    confirmText = "Yes, delete",
    typeToConfirm = false,
  } = opts;

  const html = `
    <div class="text-left">
      <p class="mb-2">You are about to permanently delete:</p>
      <p class="mb-3 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-navy">${escapeHtml(itemLabel)}</p>
      <p class="text-rose-600 text-xs font-semibold">This action cannot be undone.</p>
      ${description ? `<p class="mt-2 text-xs text-slate-500">${escapeHtml(description)}</p>` : ""}
      ${typeToConfirm ? `<p class="mt-3 text-xs">Type <b>DELETE</b> to confirm:</p>` : ""}
    </div>`;

  const result = await base.fire({
    icon: "warning",
    iconColor: "#e11d48",
    title,
    html,
    input: typeToConfirm ? "text" : undefined,
    inputPlaceholder: typeToConfirm ? "DELETE" : undefined,
    inputValidator: typeToConfirm
      ? (v: string) => (v === "DELETE" ? null : "You must type DELETE to confirm")
      : undefined,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    focusCancel: true,
  });

  return result.isConfirmed;
}

export async function notifyDeleted(itemLabel: string) {
  await base.fire({
    icon: "success",
    title: "Deleted",
    text: `${itemLabel} was removed.`,
    timer: 1800,
    showConfirmButton: false,
  });
}

export async function notifyError(message: string) {
  await base.fire({
    icon: "error",
    title: "Something went wrong",
    text: message,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export { base as swal };