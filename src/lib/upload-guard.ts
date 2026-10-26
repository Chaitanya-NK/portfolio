// spread onto <SheetContent> / <DialogContent> so the upload modal can sit on top of them
// without being treated as an "outside click" (which would close the panel and lose unsaved work)
export const guardUpload = {
  onInteractOutside: (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (t?.closest?.("[data-upload-center]")) e.preventDefault();
  },
  onEscapeKeyDown: (e: KeyboardEvent) => {
    // Escape belongs to the upload modal while it is open
    if (document.querySelector("[data-upload-center]")) e.preventDefault();
  },
};
