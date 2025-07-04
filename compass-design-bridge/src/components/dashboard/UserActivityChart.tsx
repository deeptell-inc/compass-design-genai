
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserActivityDataPoint {
  date: string;
  pageViews: number;
  clicks: number;
  conversions?: number;
}

interface UserActivityChartProps {
  data: UserActivityDataPoint[];
}

const UserActivityChart = ({ data }: UserActivityChartProps) => {
  const [timeFrame, setTimeFrame] = React.useState("7d");

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">User Activity</CardTitle>
        <Select
          value={timeFrame}
          onValueChange={setTimeFrame}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pageViews" stroke="#9B87F5" activeDot={{ r: 8 }} name="Page Views" />
            <Line type="monotone" dataKey="clicks" stroke="#7E69AB" name="Clicks" />
            <Line type="monotone" dataKey="conversions" stroke="#4CAF50" name="Conversions" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default UserActivityChart;
