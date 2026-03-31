import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="theme-tooltip rounded-2xl border px-4 py-3 text-sm shadow-soft">
      <p className="font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="theme-text mt-1">
          {entry.name}:{" "}
          <span className="theme-heading font-medium">
            {entry.dataKey === "avgOccupancy"
              ? `${Math.round(entry.value * 100)}%`
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function getBarColor(status) {
  if (status === "overutilized") {
    return "#ef4444";
  }
  if (status === "underutilized") {
    return "#facc15";
  }
  return "#38bdf8";
}

export default function Charts({ theme, rooms, timeSeries }) {
  const chartRooms = rooms.map((room) => ({
    ...room,
    roomLabel: room.roomNameEn || room.roomNameHi || "Room"
  }));
  const axisColor = theme === "light" ? "#64748b" : "#94a3b8";
  const gridColor =
    theme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.15)";

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <article className="theme-panel-muted rounded-[30px] border p-5 shadow-soft">
        <div className="mb-4">
          <h3 className="theme-heading text-lg font-semibold">Room Occupancy Overview</h3>
          <p className="theme-muted mt-1 text-sm">
            Average occupancy per room, with overcrowded and underutilized spaces highlighted.
          </p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRooms} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="roomLabel"
                stroke={axisColor}
                tickLine={false}
                axisLine={false}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke={axisColor}
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgOccupancy" name="Avg Occupancy" radius={[10, 10, 0, 0]}>
                {chartRooms.map((room) => (
                  <Cell key={room.roomId} fill={getBarColor(room.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="theme-panel-muted rounded-[30px] border p-5 shadow-soft">
        <div className="mb-4">
          <h3 className="theme-heading text-lg font-semibold">Student Load Timeline</h3>
          <p className="theme-muted mt-1 text-sm">
            Concurrent student presence across time slots to reveal block pressure and peak hour.
          </p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="time" stroke={axisColor} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="students"
                name="Students"
                stroke="#fb923c"
                strokeWidth={3}
                dot={{ r: 4, fill: "#fdba74", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#fff7ed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
