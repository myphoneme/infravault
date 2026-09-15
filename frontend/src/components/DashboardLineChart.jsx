import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const LINE_COLORS = [
  "#ff7900",
  "#111827",
  "#6b7280",
  "#9ca3af",
  "#d97706",
  "#374151",
];

export default function DashboardLineChart({
  title,
  description,
  icon: Icon,
  data = [],
  lines = [],
  metrics = [],
  year,
  onYearChange,
}) {
  return (
    <div className="dashboard-chart-card">

      {/* Header */}
      <div className="dashboard-section-header">

        <div className="dashboard-chart-title-wrapper">
          <div className="dashboard-chart-icon">
            {Icon && <Icon size={22} strokeWidth={1.8} />}
          </div>

          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="dashboard-chart-year">
          <span>Year</span>

          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {Array.from(
              { length: 6 },
              (_, index) => new Date().getFullYear() - index
            ).map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Line Graph */}
      <div className="dashboard-chart">

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="month"
              tick={{
                fontSize: 12,
                fill: "#6b7280",
              }}
              axisLine={{
                stroke: "#d1d5db",
              }}
              tickLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fontSize: 12,
                fill: "#6b7280",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "13px",
              }}
            />

            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={
                  line.color ||
                  LINE_COLORS[index % LINE_COLORS.length]
                }
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* Current Metrics */}
      {metrics.length > 0 && (
        <div className="dashboard-overview-metrics">

          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`dashboard-metric-row ${
                metric.className || ""
              }`}
            >
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}