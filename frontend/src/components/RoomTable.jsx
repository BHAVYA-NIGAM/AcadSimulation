function statusClasses(status) {
  if (status === "overutilized") {
    return "border-rose-400/30 bg-rose-500/10";
  }
  if (status === "underutilized") {
    return "border-amber-400/30 bg-amber-500/10";
  }
  return "border-emerald-400/30 bg-emerald-500/10";
}

function statusText(status) {
  if (status === "overutilized") {
    return "Overutilized";
  }
  if (status === "underutilized") {
    return "Underutilized";
  }
  return "Balanced";
}

const FLOOR_ORDER = ["Ground", "First", "Second", "Third"];

function groupByFloor(rooms) {
  const grouped = new Map();

  for (const room of rooms) {
    const floor = room.floor || "Unassigned";
    const existing = grouped.get(floor) || [];
    existing.push(room);
    grouped.set(floor, existing);
  }

  return [...grouped.entries()]
    .map(([floor, items]) => ({
      floor,
      items: items.sort((left, right) =>
        (left.roomNameEn || "").localeCompare(right.roomNameEn || "")
      )
    }))
    .sort(
      (left, right) =>
        FLOOR_ORDER.indexOf(left.floor) - FLOOR_ORDER.indexOf(right.floor)
    );
}

export default function RoomTable({ rooms }) {
  const groupedRooms = groupByFloor(rooms);

  return (
    <article className="theme-panel-muted rounded-[30px] border p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="theme-heading text-lg font-semibold">Room Utilization Studio</h3>
        <p className="theme-muted mt-1 text-sm">
          Card-based room intelligence with occupancy, utilization, and action recommendations.
        </p>
      </div>

      <div className="space-y-5">
        {groupedRooms.map((group) => (
          <section key={group.floor} className="theme-surface rounded-[24px] border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="theme-heading text-base font-semibold">{group.floor} Floor</h4>
              <span className="theme-badge rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]">
                {group.items.length} rooms
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {group.items.map((room) => (
                <div
                  key={room.roomId}
                  className={`rounded-[24px] border p-5 shadow-soft ${statusClasses(room.status)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="theme-heading text-lg font-semibold">{room.roomNameEn || "Room"}</h5>
                      <p className="theme-text mt-1 text-sm">
                        {[room.roomNameHi, room.type].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    <span className="theme-badge rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                      {statusText(room.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="theme-surface-soft rounded-2xl border p-3">
                      <p className="theme-muted text-xs uppercase tracking-[0.2em]">Capacity</p>
                      <p className="theme-heading mt-2 text-xl font-semibold">{room.capacity}</p>
                    </div>
                    <div className="theme-surface-soft rounded-2xl border p-3">
                      <p className="theme-muted text-xs uppercase tracking-[0.2em]">Utilization</p>
                      <p className="theme-heading mt-2 text-xl font-semibold">
                        {Math.round(room.utilization * 100)}%
                      </p>
                    </div>
                    <div className="theme-surface-soft rounded-2xl border p-3">
                      <p className="theme-muted text-xs uppercase tracking-[0.2em]">Avg Occupancy</p>
                      <p className="theme-heading mt-2 text-xl font-semibold">
                        {Math.round(room.avgOccupancy * 100)}%
                      </p>
                    </div>
                    <div className="theme-surface-soft rounded-2xl border p-3">
                      <p className="theme-muted text-xs uppercase tracking-[0.2em]">Type</p>
                      <p className="theme-heading mt-2 text-base font-semibold">{room.type || "-"}</p>
                    </div>
                  </div>

                  <div className="theme-surface-soft theme-text mt-5 rounded-2xl border p-4 text-sm">
                    {room.recommendation || "No action needed for this room right now."}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
