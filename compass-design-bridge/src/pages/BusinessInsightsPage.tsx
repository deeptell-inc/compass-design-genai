import React, { useState, useEffect } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { businessMetrics } from "@/services/mockData";
import { mcpService } from "@/services/mcpService";
import { toast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Target, Clock, Calculator, PieChart } from "lucide-react";

const BusinessInsightsPage = () => {
  const [metrics, setMetrics] = useState(businessMetrics);
  const [roiData, setRoiData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      const [metricsResponse, insightsResponse] = await Promise.all([
        mcpService.fetchBusinessMetrics(),
        mcpService.generateBusinessInsights({
          businessMetrics: metrics,
          designChanges: [
            { type: 'cta_optimization', description: 'CTAボタンの最適化' },
            { type: 'checkout_simplification', description: 'チェックアウトプロセスの簡素化' },
          ],
        }),
      ]);

      if (metricsResponse.success) {
        setMetrics(metricsResponse.data);
      }

      if (insightsResponse.success) {
        setRoiData(insightsResponse.data.roiCalculations);
        setRecommendations(insightsResponse.data.recommendations);
      }
    } catch (error) {
      toast({
        title: "データ読み込みエラー",
        description: "ビジネスデータの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateROIReport = async () => {
    setLoading(true);
    try {
      const response = await mcpService.generateBusinessInsights({
        businessMetrics: metrics,
        designChanges: [
          { type: 'cta_optimization', description: 'CTAボタンの最適化' },
          { type: 'checkout_simplification', description: 'チェックアウトプロセスの簡素化' },
          { type: 'mobile_optimization', description: 'モバイル最適化' },
          { type: 'page_speed_improvement', description: 'ページ速度改善' },
        ],
        timeframe: '90d',
      });

      if (response.success) {
        setRoiData(response.data.roiCalculations);
        setRecommendations(response.data.recommendations);
        toast({
          title: "ROI分析完了",
          description: "詳細なROI分析レポートが生成されました",
        });
      }
    } catch (error) {
      toast({
        title: "分析エラー",
        description: "ROI分析の実行に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">ビジネスインサイト</h1>
        <p className="text-muted-foreground">
          UX改善がビジネス成果に与える影響を定量的に分析
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
                <p className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">顧客生涯価値</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.customerLifetimeValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">満足度スコア</p>
                <p className="text-2xl font-bold">{metrics.userSatisfactionScore}/5.0</p>
              </div>
              <Target className="h-8 w-8 text-mcp-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roi" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roi">ROI分析</TabsTrigger>
          <TabsTrigger value="recommendations">戦略提案</TabsTrigger>
          <TabsTrigger value="metrics">KPI追跡</TabsTrigger>
        </TabsList>

        <TabsContent value="roi">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">投資収益率（ROI）分析</h3>
              <Button onClick={generateROIReport} disabled={loading} className="bg-mcp-primary hover:bg-mcp-tertiary">
                {loading ? "分析中..." : "詳細ROI分析"}
              </Button>
            </div>

            {roiData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">現在の収益</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {formatCurrency(roiData.baselineRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">月間ベースライン</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">予測収益</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(roiData.projectedRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">改善後の予測</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">収益増加</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(roiData.revenueIncrease)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">月間増加額</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">実装コスト</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(roiData.implementationCost)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">一時的な投資</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {roiData.roi}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">投資収益率</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">回収期間</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {roiData.paybackPeriod}ヶ月
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">投資回収期間</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>AI生成戦略提案</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{recommendations}</pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    ROI分析を実行して戦略提案を生成してください
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>主要KPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">コンバージョン率</span>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.conversionRate * 10} className="w-20 h-2" />
                    <span className="text-sm font-medium">{metrics.conversionRate}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">直帰率</span>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.bounceRate * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{(metrics.bounceRate * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">ページ読み込み時間</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(5 - metrics.pageLoadTime) * 20} className="w-20 h-2" />
                    <span className="text-sm font-medium">{metrics.pageLoadTime}s</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">満足度スコア</span>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.userSatisfactionScore * 20} className="w-20 h-2" />
                    <span className="text-sm font-medium">{metrics.userSatisfactionScore}/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>収益指標</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">平均注文額</span>
                  <span className="font-medium">{formatCurrency(metrics.averageOrderValue)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">顧客生涯価値</span>
                  <span className="font-medium">{formatCurrency(metrics.customerLifetimeValue)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">月間予測収益</span>
                  <span className="font-medium text-green-600">
                    {roiData ? formatCurrency(roiData.baselineRevenue) : '分析中...'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">改善後予測収益</span>
                  <span className="font-medium text-blue-600">
                    {roiData ? formatCurrency(roiData.projectedRevenue) : '分析中...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default BusinessInsightsPage;
