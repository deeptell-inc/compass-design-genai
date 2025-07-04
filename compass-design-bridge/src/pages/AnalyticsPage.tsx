import React, { useState, useEffect } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { userBehaviorData, businessMetrics } from "@/services/mockData";
import { mcpService } from "@/services/mcpService";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, Users, MousePointer, Clock, Target, DollarSign } from "lucide-react";

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [metrics, setMetrics] = useState(businessMetrics);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [insightsResponse, metricsResponse] = await Promise.all([
        mcpService.generateAIInsights({
          designData: { userBehaviorData },
          includeExternalData: true,
        }),
        mcpService.fetchBusinessMetrics(),
      ]);

      if (insightsResponse.success) {
        setInsights(insightsResponse.data.insights || []);
      }

      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }
    } catch (error) {
      toast({
        title: "データ読み込みエラー",
        description: "分析データの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDeepInsights = async () => {
    setLoading(true);
    try {
      const response = await mcpService.generateAIInsights({
        designData: { userBehaviorData, businessMetrics: metrics },
        userBehaviorData,
        includeExternalData: true,
      });

      if (response.success) {
        setInsights(response.data.insights || []);
        toast({
          title: "深層分析完了",
          description: "AI による詳細な分析が完了しました",
        });
      }
    } catch (error) {
      toast({
        title: "分析エラー",
        description: "深層分析の実行に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">高度な分析ダッシュボード</h1>
        <p className="text-muted-foreground">
          ユーザー行動とビジネス指標の包括的な分析
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">コンバージョン率</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均注文額</p>
                <p className="text-2xl font-bold">¥{metrics.averageOrderValue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">直帰率</p>
                <p className="text-2xl font-bold">{(metrics.bounceRate * 100).toFixed(1)}%</p>
              </div>
              <Users className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ページ読み込み時間</p>
                <p className="text-2xl font-bold">{metrics.pageLoadTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="behavior" className="space-y-6">
        <TabsList>
          <TabsTrigger value="behavior">ユーザー行動</TabsTrigger>
          <TabsTrigger value="insights">AI インサイト</TabsTrigger>
          <TabsTrigger value="trends">トレンド分析</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>セッション数推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userBehaviorData}>
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
                  <BarChart data={userBehaviorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bounceRate" fill="#ef4444" />
                    <Bar dataKey="avgSessionDuration" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">AI 生成インサイト</h3>
              <Button onClick={generateDeepInsights} disabled={loading} className="bg-mcp-primary hover:bg-mcp-tertiary">
                {loading ? "分析中..." : "深層分析実行"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.impact === 'high' ? '高' : insight.impact === 'medium' ? '中' : '低'}インパクト
                      </span>
                      <span className="text-xs text-muted-foreground">
                        信頼度: {Math.round((insight.confidence || 0.7) * 100)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>パフォーマンストレンド</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={userBehaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" stroke="#6366f1" name="セッション数" />
                  <Line type="monotone" dataKey="avgSessionDuration" stroke="#22c55e" name="平均セッション時間" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default AnalyticsPage;
