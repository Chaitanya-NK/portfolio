import { BackupPanel } from "./backup-panel";

export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Backup &amp; restore</h1>
      <p className="mb-6 text-sm text-neutral-600">Download all your content as one file, or load a backup back in. Uploaded images and files are not inside the backup, only their links.</p>
      <BackupPanel />
    </div>
  );
}
