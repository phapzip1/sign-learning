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
            <CartesianGrid strokeDasharray={[3, 3]} />
            <Typed.XAxis dataKey="date" />
            <Typed.YAxis width="auto" />
            <Tooltip />
            <Legend />
            <Typed.Line dataKey="count" />
        </Typed.LineChart>
    );
}

export default ActivityChart;