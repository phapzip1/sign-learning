import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    createHorizontalChart
} from "recharts";

const data = [
  { month: "Jan", words: 1 },
  { month: "Feb", words: 8 },
  { month: "Mar", words: 4 },
  { month: "Apr", words: 6 },
  { month: "May", words: 3 },
  { month: "Jun", words: 3 },
];

const Typed = createHorizontalChart<typeof data[number], string, number>()({ XAxis, YAxis, Tooltip, Line });

const ActivityChart: React.FC = () => {

    return (
        <Typed.LineChart
            style={{ width: "100%", maxHeight: "30vh", aspectRatio: 1.618 }}
            responsive
            data={data}
            className="mt-4"
        >
            <CartesianGrid strokeDasharray={[3, 3]} />
            <Typed.XAxis dataKey="month" />
            <Typed.YAxis width="auto" />
            <Tooltip />
            <Legend />
            <Typed.Line dataKey="words" />
        </Typed.LineChart>
    );
}

export default ActivityChart;