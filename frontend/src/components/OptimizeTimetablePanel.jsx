import { useEffect, useState } from "react";
import {
  applyOptimization,
  fetchOptimizations,
} from "../services/api.js";

function optimizationTitle(item) {
  return item.type === "consolidation"
    ? "Room Consolidation"
    : "Lower-Floor Reallocation";
}

export default function OptimizeTimetablePanel({
  metrics,
  onApplied,
  onOpenEditor,
}) {
  const [optimizations, setOptimizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOptimizations() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchOptimizations(metrics?.meta?.recordId);
        if (isMounted) {
          setOptimizations(response.optimizations || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load timetable optimization options.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOptimizations();
    return () => {
      isMounted = false;
    };
  }, [metrics]);

  async function handleApply(item) {
    setActiveClassId(item.classId);
    setError("");

    try {
      const response = await applyOptimization({
        recordId: metrics?.meta?.recordId,
        classId: item.classId,
        day: item.day,
        startTime: item.startTime,
        toRoom: item.toRoom,
      });

      setOptimizations((current) =>
        current.filter(
          (entry) =>
            !(
              entry.classId === item.classId &&
              entry.day === item.day &&
              entry.startTime === item.startTime
            ),
        ),
      );
      onApplied(
        response.metrics,
        `${item.classId} shifted from ${item.fromRoom} to ${item.toRoom}.`,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to apply the selected optimization.",
      );
    } finally {
      setActiveClassId("");
    }
  }

  return (
    <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Optimize Timetable</h3>
          <p className="mt-1 text-sm text-slate-400">
            Review suggested room shifts and apply them directly to create a new saved timetable record.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditor}
          className="rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20"
        >
          Open Full Timetable Editor
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
          Loading optimization suggestions...
        </div>
      ) : null}

      {!isLoading && !optimizations.length ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-5 text-sm text-emerald-100">
          No optimization suggestions are available for the currently loaded timetable.
        </div>
      ) : null}

      {!isLoading && optimizations.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {optimizations.map((item) => (
            <section
              key={`${item.type}-${item.classId}-${item.toRoom}`}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-300">
                    {optimizationTitle(item)}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-white">
                    {item.classId}
                  </h4>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {item.type}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p className="text-white">{item.time}</p>
                <p>
                  <span className="text-slate-400">From:</span> {item.fromRoom}
                </p>
                <p>
                  <span className="text-slate-400">To:</span> {item.toRoom}
                </p>
                <p>{item.benefit || "Suggested for better timetable efficiency."}</p>
              </div>

              <button
                type="button"
                onClick={() => handleApply(item)}
                disabled={activeClassId === item.classId}
                className="mt-5 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-100 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activeClassId === item.classId ? "Applying..." : "Shift Class"}
              </button>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
}
