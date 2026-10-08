import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    createHorizontalChart
} from "recharts";
import { RemoteActivity } from "@/src/types/stats.type";
import { useMemo } from "react";


const ActivityChart: React.FC<{ data: RemoteActivity[] }> = ({ data }) => {
    const Typed = useMemo(() => createHorizontalChart<RemoteActivity, string, number>()({ XAxis, YAxis, Tooltip, Line }), [data]);

    return (
        <Typed.LineChart
            style={{ width: "100%", maxHeight: "30vh", aspectRatio: 1.618 }}
            responsive
            data={data}
            className="mt-4"
        >
            <CartesianGrid strokeDasharray={[4, 4]} stroke="var(--border)" vertical={false} />
            <Typed.XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Typed.YAxis width="auto" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)" }}
                cursor={{ stroke: "var(--chart-1)", strokeOpacity: 0.3 }}
            />
            <Legend />
            <Typed.Line
                dataKey="count"
                name="Reviews"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--chart-1)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--highlight)", stroke: "var(--chart-1)", strokeWidth: 2 }}
            />
        </Typed.LineChart>
    );
}

export default ActivityChart;