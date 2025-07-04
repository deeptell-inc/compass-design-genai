
import React, { useState } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import UserActivityChart from "@/components/dashboard/UserActivityChart";
import FigmaIntegrationCard from "@/components/dashboard/FigmaIntegrationCard";
import CodeGenerationCard from "@/components/dashboard/CodeGenerationCard";
import AIInsightsCard from "@/components/dashboard/AIInsightsCard";
import AutoFlowEngine from "@/components/dashboard/AutoFlowEngine";
import { aiInsights, figmaProjects, userBehaviorData } from "@/services/mockData";
import { Code, Activity, Figma, LineChart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { type AiInsight } from "@/services/mockData";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [insights, setInsights] = useState<AiInsight[]>(aiInsights);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const {
    stats,
    activityData,
    loading: analyticsLoading,
    error: analyticsError,
    refreshStats,
    recordDesignProcessed,
    recordCodeGeneration,
    recordDesignToken,
  } = useAnalytics();

  const handleConnect = () => {
    // Mock connection to Figma
    setTimeout(() => {
      setConnected(true);
      toast({
        title: "Connected to Figma",
        description: "Successfully connected to Figma API.",
      });
    }, 1000);
  };

  const handleFetchDesign = async (fileUrl: string) => {
    // Mock fetching design from Figma
    toast({
      title: "Fetching design",
      description: `Retrieving design from ${fileUrl}`,
    });

    // Record the design processing
    setTimeout(async () => {
      await recordDesignProcessed({
        design_name: `Design from ${fileUrl}`,
        figma_file_id: fileUrl,
        processing_time: Math.floor(Math.random() * 3000 + 1000),
      });
      
      toast({
        title: "Design processed",
        description: "Design has been successfully processed and analytics updated",
      });
    }, 2000);
  };

  const handleGenerateCode = async () => {
    // Mock code generation
    toast({
      title: "Generating code",
      description: "Starting code generation process...",
    });

    // Record the code generation
    setTimeout(async () => {
      const frameworks = ["React", "Vue", "Angular"];
      const selectedFramework = frameworks[Math.floor(Math.random() * frameworks.length)];
      const qualityScore = Math.round((Math.random() * 3 + 7) * 10) / 10; // 7.0-10.0

      await recordCodeGeneration({
        framework: selectedFramework,
        quality_score: qualityScore,
      });

      // Also record some design tokens
      const tokenTypes = ["color", "typography", "spacing", "border-radius"];
      for (let i = 0; i < 3; i++) {
        await recordDesignToken({
          token_type: tokenTypes[Math.floor(Math.random() * tokenTypes.length)],
          token_name: `token-${Date.now()}-${i}`,
          token_value: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        });
      }

      toast({
        title: "Code generated",
        description: `${selectedFramework} code generated with quality score ${qualityScore}/10`,
      });
    }, 3000);
  };

  const handleRequestInsights = () => {
    setLoadingInsights(true);

    // Mock AI insights generation
    setTimeout(() => {
      // サーバーから新しいインサイトを取得するのをシミュレート
      const newInsights = generateMockInsights() as AiInsight[];
      setInsights(newInsights);
      setLoadingInsights(false);
      
      toast({
        title: "New insights generated",
        description: "AI has analyzed your data and generated new insights.",
      });
    }, 2000);
  };

  // Mock insights generator from mockData.ts
  const generateMockInsights = () => {
    const insights = [
      {
        id: (Math.random() * 1000).toFixed(0),
        title: "Form field validation feedback",
        description: "Adding inline validation feedback to form fields could improve completion rates by approximately 12-18%.",
        impact: "medium" as const,
        category: "ux" as const,
      },
      {
        id: (Math.random() * 1000).toFixed(0),
        title: "Header contrast improvement",
        description: "Increasing the contrast between the header text and background would improve readability for 15% of users.",
        impact: "medium" as const,
        category: "ux" as const, // ui から ux に変更
      },
      {
        id: (Math.random() * 1000).toFixed(0),
        title: "Product image display",
        description: "User engagement data shows 23% higher interaction with products that display multiple angles in the gallery.",
        impact: "high" as const,
        category: "conversion" as const, // engagement から conversion に変更
      },
      {
        id: (Math.random() * 1000).toFixed(0),
        title: "Loading states feedback",
        description: "Adding visual feedback during loading states could reduce perceived wait time and lower bounce rates.",
        impact: "low" as const,
        category: "ux" as const,
      },
    ];
    
    // ランダムに3つ選択
    return insights.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">MCP ダッシュボード</h1>
            <p className="text-muted-foreground">
              Figmaデザイン統合とコード生成のためのマルチクリエイションプラットフォーム
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analyticsError && (
              <span className="text-xs text-orange-600">API接続なし - モックデータ使用中</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={analyticsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="処理済みデザイン" 
          value={stats?.designsProcessed.value || 0} 
          icon={<Figma size={18} />}
          trend={stats?.designsProcessed.trend || { value: 0, isPositive: true }}
          loading={analyticsLoading}
        />
        <StatCard 
          title="コード生成リクエスト" 
          value={stats?.codeGenerationRequests.value || 0} 
          icon={<Code size={18} />} 
          trend={stats?.codeGenerationRequests.trend || { value: 0, isPositive: true }}
          loading={analyticsLoading}
        />
        <StatCard 
          title="抽出されたデザイントークン" 
          value={stats?.designTokensExtracted.value || 0} 
          icon={<Activity size={18} />}
          trend={stats?.designTokensExtracted.trend || { value: 0, isPositive: true }}
          loading={analyticsLoading}
        />
        <StatCard 
          title="平均コード品質スコア" 
          value={stats?.averageCodeQualityScore.value || 0} 
          icon={<LineChart size={18} />}
          trend={stats?.averageCodeQualityScore.trend || { value: 0, isPositive: true }}
          description="10点満点"
          loading={analyticsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <UserActivityChart data={activityData.length > 0 ? activityData : [
            { date: "05/10", pageViews: 320, clicks: 120, conversions: 12 },
            { date: "05/11", pageViews: 332, clicks: 132, conversions: 14 },
            { date: "05/12", pageViews: 401, clicks: 191, conversions: 18 },
            { date: "05/13", pageViews: 350, clicks: 153, conversions: 15 },
            { date: "05/14", pageViews: 425, clicks: 176, conversions: 19 },
            { date: "05/15", pageViews: 378, clicks: 147, conversions: 16 },
            { date: "05/16", pageViews: 410, clicks: 168, conversions: 21 },
          ]} />
        </div>
        <div>
          <AIInsightsCard 
            insights={insights} 
            onRequestInsights={handleRequestInsights}
            loading={loadingInsights}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FigmaIntegrationCard
          connected={connected}
          onConnect={handleConnect}
          onFetchDesign={handleFetchDesign}
        />
        <CodeGenerationCard
          title="コード生成"
          description="Figmaデザインを洗練された、本番環境対応のコードに変換"
          frameworks={["React", "Vue", "Tailwind CSS"]}
          onGenerate={handleGenerateCode}
        />
      </div>

      <div className="mb-6">
        <AutoFlowEngine 
          userBehaviorData={userBehaviorData}
          designData={{ 
            figmaProjects, 
            stats: stats || {
              designsProcessed: { value: 0, trend: { value: 0, isPositive: true } },
              codeGenerationRequests: { value: 0, trend: { value: 0, isPositive: true } },
              designTokensExtracted: { value: 0, trend: { value: 0, isPositive: true } },
              averageCodeQualityScore: { value: 0, trend: { value: 0, isPositive: true } }
            }
          }}
        />
      </div>
    </MainLayout>
  );
};

export default Index;
