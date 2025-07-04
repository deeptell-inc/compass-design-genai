import React, { useState } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp, Users, Lightbulb } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

interface StrategicContext {
  businessGoal: string;
  targetAudience: string;
  keyMetrics: string;
  constraints: string;
  timeline: string;
}

interface DesignStrategy {
  id: string;
  context: StrategicContext;
  designRecommendations: string[];
  uxInsights: string[];
  businessImpact: string;
  implementationPlan: string;
  timestamp: Date;
  status: 'generating' | 'completed' | 'error';
}

const StrategicDesignPage: React.FC = () => {
  const [businessGoal, setBusinessGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyMetrics, setKeyMetrics] = useState("");
  const [constraints, setConstraints] = useState("");
  const [timeline, setTimeline] = useState("3ヶ月");
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategies, setStrategies] = useState<DesignStrategy[]>([]);

  const handleGenerateStrategy = async () => {
    if (!businessGoal.trim() || !targetAudience.trim()) {
      toast({
        title: "エラー",
        description: "ビジネス目標とターゲットユーザーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const strategyId = Date.now().toString();
    
    const context: StrategicContext = {
      businessGoal: businessGoal.trim(),
      targetAudience: targetAudience.trim(),
      keyMetrics: keyMetrics.trim(),
      constraints: constraints.trim(),
      timeline,
    };

    const newStrategy: DesignStrategy = {
      id: strategyId,
      context,
      designRecommendations: [],
      uxInsights: [],
      businessImpact: "",
      implementationPlan: "",
      timestamp: new Date(),
      status: 'generating'
    };

    setStrategies(prev => [newStrategy, ...prev]);

    try {
      const prompt = `
経営戦略に基づくUXデザイン戦略を策定してください：

ビジネス目標: ${businessGoal}
ターゲットユーザー: ${targetAudience}
重要指標: ${keyMetrics || "未指定"}
制約条件: ${constraints || "未指定"}
実装期間: ${timeline}

以下の観点から包括的な戦略を提案してください：
1. デザイン推奨事項（具体的なUI/UX改善案）
2. UXインサイト（ユーザー行動とビジネス目標の関連性）
3. ビジネスインパクト（ROI予測と成功指標）
4. 実装計画（優先順位と段階的アプローチ）

PMや経営層が意思決定に活用できる具体的で実行可能な提案をお願いします。
      `;

      const result = await apiService.generateBrainstormResponse(prompt, 'gpt-4o');
      
      if (result.success) {
        const response = result.data.response;
        
        setStrategies(prev => 
          prev.map(strategy => 
            strategy.id === strategyId 
              ? { 
                  ...strategy, 
                  designRecommendations: extractSection(response, "デザイン推奨事項"),
                  uxInsights: extractSection(response, "UXインサイト"),
                  businessImpact: extractSingleSection(response, "ビジネスインパクト"),
                  implementationPlan: extractSingleSection(response, "実装計画"),
                  status: 'completed' 
                }
              : strategy
          )
        );

        toast({
          title: "成功",
          description: "戦略的デザイン提案が生成されました！",
        });
      } else {
        throw new Error(result.error);
      }

      setBusinessGoal("");
      setTargetAudience("");
      setKeyMetrics("");
      setConstraints("");
    } catch (error) {
      console.error('Strategy generation error:', error);
      
      setStrategies(prev => 
        prev.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, status: 'error' }
            : strategy
        )
      );

      toast({
        title: "エラー",
        description: "戦略生成中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const extractSection = (text: string, sectionName: string): string[] => {
    const regex = new RegExp(`${sectionName}[：:]([\\s\\S]*?)(?=\\n\\n|\\n[0-9]\\.|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1]
        .split(/\n/)
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  };

  const extractSingleSection = (text: string, sectionName: string): string => {
    const regex = new RegExp(`${sectionName}[：:]([\\s\\S]*?)(?=\\n\\n|\\n[0-9]\\.|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const handleGenerateDesignFromStrategy = async (strategy: DesignStrategy) => {
    const designPrompt = `
ビジネス目標: ${strategy.context.businessGoal}
ターゲットユーザー: ${strategy.context.targetAudience}

上記の戦略に基づいて、具体的なUI/UXデザインを生成してください。
モダンで使いやすく、ビジネス目標達成に貢献するデザインをお願いします。
    `;

    try {
      const result = await apiService.generateDesign(designPrompt, 'modern');
      
      if (result.success) {
        toast({
          title: "成功",
          description: "戦略に基づくデザインが生成されました！",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "デザイン生成中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">戦略的デザイン策定</h1>
          <p className="text-muted-foreground">
            経営戦略からUXデザイン戦略を策定し、具体的な実装計画を提案します
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              ビジネス戦略入力
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="business-goal" className="text-sm font-medium">
                  ビジネス目標 *
                </label>
                <Textarea
                  id="business-goal"
                  placeholder="例: 新規顧客獲得率を30%向上させる、ユーザーエンゲージメントを2倍にする"
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="target-audience" className="text-sm font-medium">
                  ターゲットユーザー *
                </label>
                <Textarea
                  id="target-audience"
                  placeholder="例: 30-40代のビジネスパーソン、IT企業の経営層、スタートアップ創業者"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="key-metrics" className="text-sm font-medium">
                  重要指標（KPI）
                </label>
                <Textarea
                  id="key-metrics"
                  placeholder="例: コンバージョン率、ユーザー滞在時間、月間アクティブユーザー数"
                  value={keyMetrics}
                  onChange={(e) => setKeyMetrics(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="constraints" className="text-sm font-medium">
                  制約条件
                </label>
                <Textarea
                  id="constraints"
                  placeholder="例: 予算制限、技術的制約、ブランドガイドライン"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">実装期間</label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1ヶ月">1ヶ月</SelectItem>
                  <SelectItem value="3ヶ月">3ヶ月</SelectItem>
                  <SelectItem value="6ヶ月">6ヶ月</SelectItem>
                  <SelectItem value="1年">1年</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleGenerateStrategy}
              disabled={isGenerating || !businessGoal.trim() || !targetAudience.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  戦略策定中...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  戦略的デザイン提案を生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {strategies.length > 0 && (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">戦略的デザイン提案</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {strategy.timestamp.toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        strategy.status === 'completed' ? 'default' :
                        strategy.status === 'generating' ? 'secondary' : 'destructive'
                      }
                    >
                      {strategy.status === 'completed' ? '完了' :
                       strategy.status === 'generating' ? '生成中' : 'エラー'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {strategy.status === 'generating' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      戦略を策定しています...
                    </div>
                  )}

                  {strategy.status === 'completed' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">ビジネス目標</h4>
                          <p className="text-sm">{strategy.context.businessGoal}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">ターゲットユーザー</h4>
                          <p className="text-sm">{strategy.context.targetAudience}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">実装期間</h4>
                          <p className="text-sm">{strategy.context.timeline}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground">重要指標</h4>
                          <p className="text-sm">{strategy.context.keyMetrics || "未指定"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="flex items-center gap-2 font-semibold">
                            <Lightbulb className="h-4 w-4" />
                            デザイン推奨事項
                          </h3>
                          <ul className="space-y-2">
                            {strategy.designRecommendations.map((rec, index) => (
                              <li key={index} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h3 className="flex items-center gap-2 font-semibold">
                            <Users className="h-4 w-4" />
                            UXインサイト
                          </h3>
                          <ul className="space-y-2">
                            {strategy.uxInsights.map((insight, index) => (
                              <li key={index} className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 font-semibold">
                          <TrendingUp className="h-4 w-4" />
                          ビジネスインパクト
                        </h3>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-line">{strategy.businessImpact}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 font-semibold">
                          <Target className="h-4 w-4" />
                          実装計画
                        </h3>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-line">{strategy.implementationPlan}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          onClick={() => handleGenerateDesignFromStrategy(strategy)}
                          variant="outline"
                        >
                          この戦略からデザインを生成
                        </Button>
                        <Button variant="outline">
                          実装計画をエクスポート
                        </Button>
                      </div>
                    </div>
                  )}

                  {strategy.status === 'error' && (
                    <p className="text-sm text-red-600">
                      戦略策定中にエラーが発生しました。もう一度お試しください。
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default StrategicDesignPage;
