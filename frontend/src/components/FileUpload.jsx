import { useRef, useState } from "react";

export default function FileUpload({
  isUploading,
  onUpload,
  onOpenTimetableEditor,
  error,
  successMessage,
}) {
  const inputRef = useRef(null);
  const [selectedName, setSelectedName] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedName(file.name);
    await onUpload(file);
  }

  return (
    <div className="theme-panel-muted rounded-[28px] border p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="theme-heading text-lg font-semibold">Workbook Upload</h2>
          <p className="theme-muted mt-1 text-sm">
            Accepted format: <span className="theme-text font-medium">.xlsx</span>
          </p>
        </div>
        {isUploading ? (
          <div className="flex items-center gap-2 text-sm text-orange-300">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-300 border-t-transparent" />
            Processing
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-orange-400/60 bg-gradient-to-br from-orange-500/10 to-sky-500/10 px-6 py-12 text-center transition hover:border-orange-300 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="theme-kicker mb-2 text-sm uppercase tracking-[0.25em]">
          Upload Excel
        </span>
        <span className="theme-heading max-w-xs text-xl font-semibold">
          Drop in the latest academic block workbook to regenerate the dashboard.
        </span>
        <span className="theme-muted mt-3 text-sm">
          {selectedName || "Choose a file to start the simulation"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-4 min-h-12 space-y-2">
        {onOpenTimetableEditor ? (
          <button
            type="button"
            onClick={onOpenTimetableEditor}
            className="theme-button-sky w-full rounded-2xl px-4 py-3"
          >
            Open Full Timetable Editor
          </button>
        ) : null}

        {successMessage ? (
          <div className="theme-alert-success rounded-2xl border px-4 py-3 text-sm">
            {successMessage}
          </div>
        ) : null}

        {error ? (
          <div className="theme-alert-error rounded-2xl border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
