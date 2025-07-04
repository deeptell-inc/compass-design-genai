import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Users, MousePointer, Clock } from "lucide-react";

interface AnalyticsData {
  date: string;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData[];
  loading?: boolean;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalSessions = data.reduce((sum, item) => sum + item.sessions, 0);
  const avgBounceRate = data.reduce((sum, item) => sum + item.bounceRate, 0) / data.length;
  const avgSessionDuration = data.reduce((sum, item) => sum + item.avgSessionDuration, 0) / data.length;
  const totalConversions = data.reduce((sum, item) => sum + item.conversions, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総セッション数</p>
                <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均直帰率</p>
                <p className="text-2xl font-bold">{(avgBounceRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均セッション時間</p>
                <p className="text-2xl font-bold">{Math.round(avgSessionDuration)}s</p>
              </div>
              <Clock className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総コンバージョン数</p>
                <p className="text-2xl font-bold">{totalConversions}</p>
              </div>
              <MousePointer className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>セッション数推移</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>直帰率とセッション時間</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bounceRate" fill="#ef4444" name="直帰率" />
                <Bar dataKey="avgSessionDuration" fill="#22c55e" name="セッション時間" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
