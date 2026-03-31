import FileUpload from "./FileUpload.jsx";

function LoadingState() {
  return (
    <section className="theme-panel-muted rounded-[30px] border p-10 text-center shadow-soft">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-300/30 border-t-orange-300" />
      <p className="theme-text mt-4 text-sm">Checking for the latest academic block data...</p>
    </section>
  );
}

export default function UploadLanding({
  isLoading,
  isUploading,
  onUpload,
  error,
  successMessage,
  hasMetrics,
  history,
  onOpenDashboard,
  onOpenTimetableEditor,
  onSelectRecord
}) {
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <section className="theme-panel overflow-hidden rounded-[32px] border shadow-soft backdrop-blur">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr] lg:p-8">
        <div className="space-y-5">
          <p className="theme-kicker text-sm uppercase tracking-[0.35em]">
            Academic Block Simulation
          </p>
          <h1 className="theme-heading font-display text-4xl leading-tight sm:text-5xl">
            Upload your timetable workbook and move into a dedicated dashboard view.
          </h1>
          <p className="theme-text max-w-2xl text-sm leading-7 sm:text-base">
            Start on this upload screen, choose an Excel workbook named in
            <span className="theme-heading mx-1 font-semibold">dd_mm_yyyy.xlsx</span>
            format, and the app will treat that filename date as the dataset date. The dashboard
            then opens automatically and stores the uploaded workbook inside backend data for
            future historical use.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="theme-panel-muted rounded-[24px] border p-4">
              <p className="theme-muted text-xs uppercase tracking-[0.2em]">Step 1</p>
              <p className="theme-heading mt-2 text-sm">Upload one `.xlsx` workbook named like `29_03_2026.xlsx`.</p>
            </div>
            <div className="theme-panel-muted rounded-[24px] border p-4">
              <p className="theme-muted text-xs uppercase tracking-[0.2em]">Step 2</p>
              <p className="theme-heading mt-2 text-sm">The app processes room load, utilization, and peak-hour pressure.</p>
            </div>
            <div className="theme-panel-muted rounded-[24px] border p-4">
              <p className="theme-muted text-xs uppercase tracking-[0.2em]">Step 3</p>
              <p className="theme-heading mt-2 text-sm">You land on the dashboard page with charts and room-level insights.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasMetrics ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="theme-button-sky px-5 py-3 font-medium"
              >
                Open Current Dashboard
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenTimetableEditor}
              className="theme-button-orange px-5 py-3 font-medium"
            >
              Open Timetable Editor
            </button>
          </div>

          {history?.length ? (
            <div className="theme-panel-muted rounded-[28px] border p-5">
              <div className="mb-4">
                <h2 className="theme-heading text-lg font-semibold">Historical Records</h2>
                <p className="theme-muted mt-1 text-sm">
                  Open previously uploaded workbook snapshots stored in backend data.
                </p>
              </div>
              <div className="space-y-3">
                {history.slice(0, 6).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onSelectRecord(record.id)}
                    className="theme-surface flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:opacity-90"
                  >
                    <div>
                      <p className="theme-heading text-sm font-medium">{record.originalName}</p>
                      <p className="theme-muted mt-1 text-xs">
                        {new Date(`${record.dataDate}T00:00:00`).toLocaleDateString()} • {record.weekday}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="theme-kicker text-xs uppercase tracking-[0.2em]">
                        Upload
                      </span>
                      <p className="theme-muted mt-1 text-xs">Open</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <FileUpload
          isUploading={isUploading}
          onUpload={onUpload}
          onOpenTimetableEditor={onOpenTimetableEditor}
          error={error}
          successMessage={successMessage}
        />
      </div>
    </section>
  );
}
