import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mcpService } from "@/services/mcpService";
import { toast } from "@/hooks/use-toast";
import { Zap, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface AutoFlowRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: 'workflow' | 'ui' | 'performance' | 'conversion';
  automationLevel: number;
  estimatedImprovement: string;
}

interface AutoFlowEngineProps {
  userBehaviorData?: any;
  designData?: any;
}

const AutoFlowEngine: React.FC<AutoFlowEngineProps> = ({ userBehaviorData, designData }) => {
  const [recommendations, setRecommendations] = useState<AutoFlowRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    if (userBehaviorData || designData) {
      runAutoFlowAnalysis();
    }
  }, [userBehaviorData, designData]);

  const runAutoFlowAnalysis = async () => {
    setLoading(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await mcpService.generateAIInsights({
        designData: designData || {},
        userBehaviorData: userBehaviorData || {},
        includeExternalData: true,
      });

      if (response.success) {
        const autoFlowRecommendations = response.data.insights.map((insight: any, index: number) => ({
          id: `autoflow-${index}`,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          effort: index % 3 === 0 ? 'low' : index % 3 === 1 ? 'medium' : 'high',
          category: insight.category === 'conversion' ? 'conversion' : 
                   insight.category === 'ux' ? 'workflow' : 
                   insight.category === 'ui' ? 'ui' : 'performance',
          automationLevel: Math.floor(Math.random() * 40) + 60,
          estimatedImprovement: `${Math.floor(Math.random() * 25) + 5}%`,
        }));

        setRecommendations(autoFlowRecommendations);
        setAnalysisProgress(100);
        
        toast({
          title: "AutoFlow分析完了",
          description: `${autoFlowRecommendations.length}件の最適化提案を生成しました`,
        });
      }
    } catch (error) {
      toast({
        title: "分析エラー",
        description: "AutoFlow分析の実行に失敗しました",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workflow': return <Zap className="h-4 w-4" />;
      case 'conversion': return <TrendingUp className="h-4 w-4" />;
      case 'performance': return <Clock className="h-4 w-4" />;
      case 'ui': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-mcp-primary" />
              AutoFlow エンジン
            </CardTitle>
            <Button 
              onClick={runAutoFlowAnalysis} 
              disabled={loading}
              className="bg-mcp-primary hover:bg-mcp-tertiary"
            >
              {loading ? "分析中..." : "分析実行"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ワークフロー分析中...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}
          
          {!loading && recommendations.length === 0 && (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                AutoFlow分析を実行してワークフロー最適化提案を生成してください
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(rec.category)}
                    <CardTitle className="text-base">{rec.title}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={getImpactColor(rec.impact)}>
                      {rec.impact === 'high' ? '高' : rec.impact === 'medium' ? '中' : '低'}インパクト
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{rec.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">実装工数</span>
                    <Badge className={getEffortColor(rec.effort)}>
                      {rec.effort === 'low' ? '低' : rec.effort === 'medium' ? '中' : '高'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">自動化レベル</span>
                    <div className="flex items-center gap-2">
                      <Progress value={rec.automationLevel} className="w-16 h-2" />
                      <span className="text-xs">{rec.automationLevel}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">予想改善効果</span>
                    <span className="text-xs font-medium text-green-600">{rec.estimatedImprovement}</span>
                  </div>
                </div>

                <Button size="sm" className="w-full mt-4 bg-mcp-primary hover:bg-mcp-tertiary">
                  実装を開始
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoFlowEngine;
