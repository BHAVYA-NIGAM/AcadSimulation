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
    <article className="theme-panel-muted rounded-[30px] border p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="theme-heading text-lg font-semibold">Optimize Timetable</h3>
          <p className="theme-muted mt-1 text-sm">
            Review suggested room shifts and apply them directly to create a new saved timetable record.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditor}
          className="theme-button-sky"
        >
          Open Full Timetable Editor
        </button>
      </div>

      {error ? (
        <div className="theme-alert-error mt-4 rounded-2xl border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="theme-surface theme-text mt-5 rounded-2xl border px-4 py-5 text-sm">
          Loading optimization suggestions...
        </div>
      ) : null}

      {!isLoading && !optimizations.length ? (
        <div className="theme-alert-success mt-5 rounded-2xl border px-4 py-5 text-sm">
          No optimization suggestions are available for the currently loaded timetable.
        </div>
      ) : null}

      {!isLoading && optimizations.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {optimizations.map((item) => (
            <section
              key={`${item.type}-${item.classId}-${item.toRoom}`}
              className="theme-surface rounded-[24px] border p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="theme-kicker text-xs uppercase tracking-[0.2em]">
                    {optimizationTitle(item)}
                  </p>
                  <h4 className="theme-heading mt-2 text-lg font-semibold">
                    {item.classId}
                  </h4>
                </div>
                <span className="theme-badge rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  {item.type}
                </span>
              </div>

              <div className="theme-text mt-4 space-y-2 text-sm">
                <p className="theme-heading">{item.time}</p>
                <p>
                  <span className="theme-muted">From:</span> {item.fromRoom}
                </p>
                <p>
                  <span className="theme-muted">To:</span> {item.toRoom}
                </p>
                <p>{item.benefit || "Suggested for better timetable efficiency."}</p>
              </div>

              <button
                type="button"
                onClick={() => handleApply(item)}
                disabled={activeClassId === item.classId}
                className="theme-button-orange mt-5 disabled:cursor-not-allowed disabled:opacity-60"
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
