
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { ModelSelector, LanguageModel } from "@/components/ui/model-selector";

interface Insight {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "ui" | "ux" | "engagement" | "conversion";
}

interface AIInsightsCardProps {
  insights: Insight[];
  onRequestInsights: () => void;
  loading?: boolean;
}

const AIInsightsCard = ({ insights, onRequestInsights, loading = false }: AIInsightsCardProps) => {
  // 影響度の日本語表記
  const impactLabels = {
    high: "高",
    medium: "中",
    low: "低"
  };

  // モデルを選択した時のハンドラー（現在はモックだがあとで実装可能）
  const handleModelChange = (model: LanguageModel) => {
    console.log("Selected model:", model);
    // 実際の実装では、選択されたモデルに基づいて洞察生成を調整
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb size={18} className="text-mcp-primary" />
          AI洞察
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Lightbulb size={48} className="text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">
              洞察情報はありません。ユーザーデータから洞察を生成してください。
            </p>
            <div className="space-y-4 w-full">
              <ModelSelector 
                defaultModelId="claude-3.5-sonnet"
                onModelChange={handleModelChange}
              />
              
              <Button onClick={onRequestInsights} className="bg-mcp-primary hover:bg-mcp-tertiary w-full" disabled={loading}>
                {loading ? "洞察を生成中..." : "洞察を生成"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ModelSelector 
              defaultModelId="claude-3.5-sonnet"
              onModelChange={handleModelChange}
            />
            
            {insights.map((insight) => (
              <div key={insight.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      insight.impact === "high"
                        ? "bg-red-100 text-red-800"
                        : insight.impact === "medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {impactLabels[insight.impact]}影響度
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
            <Button
              onClick={onRequestInsights} 
              className="w-full" 
              variant="outline"
              disabled={loading}
            >
              {loading ? "更新中..." : "洞察を更新"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightsCard;
