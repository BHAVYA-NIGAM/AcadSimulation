import { useEffect, useMemo, useRef, useState } from "react";
import { fetchTimetableTemplate, saveTimetableDay } from "../services/api.js";

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function buildRoomOptions(rooms) {
  return [
    { roomId: "TBA", label: "TBA" },
    ...(rooms || []).map((room) => ({
      roomId: room.roomId,
      label: `${room.roomId} • ${room.roomNameEn || room.floor || "Room"}`,
    })),
  ];
}

function weekdayFromDate(isoDate) {
  if (!isoDate) {
    return DAY_OPTIONS[0];
  }

  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function buildSubjectMap(rows) {
  const map = new Map();

  for (const row of rows || []) {
    const existing = map.get(row.classId) || new Set();
    existing.add(row.subject);
    map.set(row.classId, existing);
  }

  return map;
}

function buildUniqueClassRows(rows) {
  const seen = new Set();
  const uniqueRows = [];

  for (const row of rows || []) {
    if (seen.has(row.classId)) {
      continue;
    }

    seen.add(row.classId);
    uniqueRows.push({ ...row });
  }

  return uniqueRows;
}

export default function TimetableEditorPage({
  sourceRecordId,
  onBack,
  onSaved,
  onOpenDashboard,
}) {
  const dateInputRef = useRef(null);
  const [template, setTemplate] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTemplate() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchTimetableTemplate(sourceRecordId);
        if (!isMounted) {
          return;
        }

        setTemplate(response);
        setRows(buildUniqueClassRows(response.timetable || []));
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load the timetable template.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, [sourceRecordId]);

  const roomOptions = useMemo(
    () => buildRoomOptions(template?.rooms || []),
    [template],
  );
  const subjectMap = useMemo(
    () => buildSubjectMap(template?.timetable || []),
    [template],
  );
  const selectedWeekday = useMemo(
    () => weekdayFromDate(selectedDate),
    [selectedDate],
  );

  function updateRow(index, field, value) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    try {
      const response = await saveTimetableDay({
        dataDate: selectedDate,
        basedOnRecordId: sourceRecordId || template?.sourceRecordId || null,
        targetRecordId: sourceRecordId || template?.sourceRecordId || null,
        timetable: rows.map((row) => ({
          ...row,
          day: selectedWeekday,
        })),
      });

      onSaved(response.metrics, `Timetable saved for ${selectedDate}.`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save the updated timetable.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Timetable Editor
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Edit the day-wise timetable using the stored room and enrollment
            inventory, then save it as a dated historical record.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20"
          >
            Open Dashboard
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-300 shadow-soft">
          Loading timetable template...
        </div>
      ) : null}

      {!isLoading && template ? (
        <>
          <section className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
              <div>
                <label
                  htmlFor="timetable-date"
                  className="text-sm text-slate-300"
                >
                  Save timetable for date
                </label>
                <div className="mt-2 flex gap-3">
                  <input
                    ref={dateInputRef}
                    id="timetable-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-orange-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        typeof dateInputRef.current?.showPicker === "function"
                      ) {
                        dateInputRef.current.showPicker();
                      } else {
                        dateInputRef.current?.focus();
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
                  >
                    Open Calendar
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Day will be saved as{" "}
                  <span className="text-white">{selectedWeekday}</span>.
                </p>
              </div>

              {/* <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rows</p>
                <p className="mt-2 text-xl font-semibold text-white">{rows.length}</p>
              </div> */}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full border mt-2 border-orange-400/30 bg-orange-500/10 px-5 py-3 text-sm font-medium text-orange-100 transition  hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Timetable"}
            </button>
          </section>

          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/60 shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Class</th>
                    <th className="px-4 py-4">Subject</th>
                    <th className="px-4 py-4">Start</th>
                    <th className="px-4 py-4">End</th>
                    <th className="px-4 py-4">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={`${row.classId}-${index}`}
                      className="border-t border-white/5"
                    >
                      <td className="px-4 py-4 align-top text-white">
                        {row.classId}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <select
                          value={row.subject}
                          onChange={(event) =>
                            updateRow(index, "subject", event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-orange-300"
                        >
                          {[
                            ...(subjectMap.get(row.classId) ||
                              new Set([row.subject])),
                          ].map((subject) => (
                            <option
                              key={`${row.classId}-${subject}`}
                              value={subject}
                            >
                              {subject}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="time"
                          value={row.startTime}
                          onChange={(event) =>
                            updateRow(index, "startTime", event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-orange-300"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="time"
                          value={row.endTime}
                          onChange={(event) =>
                            updateRow(index, "endTime", event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-orange-300"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <select
                          value={row.roomId}
                          onChange={(event) =>
                            updateRow(index, "roomId", event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none transition focus:border-orange-300"
                        >
                          {roomOptions.map((option) => (
                            <option key={option.roomId} value={option.roomId}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
