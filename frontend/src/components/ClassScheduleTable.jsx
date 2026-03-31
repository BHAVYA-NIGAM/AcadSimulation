import ClassShiftPanel from "./ClassShiftPanel.jsx";
import RoomShiftControl from "./RoomShiftControl.jsx";

function statusClasses(status) {
  if (status === "overcrowded") {
    return "border-rose-400/30 bg-rose-500/10";
  }
  if (status === "underutilized") {
    return "border-amber-400/30 bg-amber-500/10";
  }
  if (status === "unassigned") {
    return "border-slate-400/30 bg-slate-500/10";
  }
  return "border-sky-400/30 bg-sky-500/10";
}

const FLOOR_ORDER = ["Ground", "First", "Second", "Third"];

function groupByFloor(classes) {
  const grouped = new Map();

  for (const classItem of classes) {
    const floor = classItem.floor || "Unassigned";
    const existing = grouped.get(floor) || [];
    existing.push(classItem);
    grouped.set(floor, existing);
  }

  return [...grouped.entries()]
    .map(([floor, items]) => ({
      floor,
      items: items.sort((left, right) => {
        const dayCompare = left.day.localeCompare(right.day);
        if (dayCompare !== 0) {
          return dayCompare;
        }
        return left.startTime.localeCompare(right.startTime);
      })
    }))
    .sort(
      (left, right) =>
        FLOOR_ORDER.indexOf(left.floor) - FLOOR_ORDER.indexOf(right.floor)
    );
}

export default function ClassScheduleTable({
  classes,
  rooms,
  currentRecordId,
  currentDate,
  history,
  onApplyOptimization,
  onSelectRecord,
}) {
  if (!classes?.length) {
    return (
      <article className="theme-panel-muted rounded-[30px] border p-6 shadow-soft">
        <h3 className="theme-heading text-lg font-semibold">Lecture Timeline</h3>
        <p className="theme-muted mt-2 text-sm">
          Class-level lecture scheduling appears here when timetable rows are available in the selected record.
        </p>
      </article>
    );
  }

  const groupedClasses = groupByFloor(classes);

  return (
    <article className="theme-panel-muted rounded-[30px] border p-6 shadow-soft">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="theme-heading text-lg font-semibold">Lecture Timeline</h3>
          <p className="theme-muted mt-1 text-sm">
            A cleaner daily schedule view with room names, program mix, and occupancy pressure.
          </p>
        </div>

        <div className="min-w-[260px]">
          <label
            htmlFor="lecture-date-select"
            className="theme-text text-sm"
          >
            Timetable date
          </label>
          <select
            id="lecture-date-select"
            value={currentRecordId || ""}
            onChange={(event) => {
              if (event.target.value) {
                onSelectRecord(event.target.value);
              }
            }}
            className="theme-input mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-orange-300"
          >
            <option value={currentRecordId || ""}>
              {currentDate
                ? new Date(`${currentDate}T00:00:00`).toLocaleDateString()
                : "Current date"}
            </option>
            {(history || [])
              .filter((record) => record.id !== currentRecordId)
              .map((record) => (
                <option key={record.id} value={record.id}>
                  {`${new Date(`${record.dataDate}T00:00:00`).toLocaleDateString()} - ${record.originalName}`}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <ClassShiftPanel
          classes={classes}
          rooms={rooms}
          recordId={currentRecordId}
          title="Shift Any Class"
          onApplied={onApplyOptimization}
        />

        {groupedClasses.map((group) => (
          <section key={group.floor} className="theme-surface rounded-[24px] border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="theme-heading text-base font-semibold">{group.floor} Floor</h4>
              <span className="theme-badge rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]">
                {group.items.length} classes
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((classItem) => (
                <div
                  key={`${classItem.classId}-${classItem.day}-${classItem.startTime}`}
                  className={`rounded-[22px] border p-4 ${statusClasses(classItem.status)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="theme-text text-xs uppercase tracking-[0.2em]">
                        {classItem.program}
                      </p>
                      <h5 className="theme-heading mt-1 text-base font-semibold">{classItem.subject}</h5>
                    </div>
                    <span className="theme-badge rounded-full border px-2 py-1 text-[11px] font-semibold">
                      {classItem.classId}
                    </span>
                  </div>

                  <div className="theme-text mt-4 space-y-2 text-sm">
                    <p>{classItem.day}</p>
                    <p className="theme-heading">
                      {classItem.startTime} - {classItem.endTime}
                    </p>
                    <p>
                      {classItem.roomNameEn || "Room"}
                    </p>
                    <p className="theme-muted">
                      {[classItem.roomNameHi, classItem.floor].filter(Boolean).join(" • ")}
                    </p>
                    <p>
                      {classItem.studentCount} / {classItem.capacity} students
                    </p>
                    <p className="theme-heading">
                      {Math.round(classItem.occupancy * 100)}% occupancy
                    </p>
                  </div>

                  <RoomShiftControl
                    classItem={classItem}
                    rooms={rooms}
                    classes={classes}
                    recordId={currentRecordId}
                    onApplied={onApplyOptimization}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
