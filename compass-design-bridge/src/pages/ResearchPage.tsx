import React, { useState, useEffect } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { uxResearchInsights } from "@/services/mockData";
import { mcpService } from "@/services/mcpService";
import { toast } from "@/hooks/use-toast";
import { Search, ExternalLink, BookOpen, Lightbulb, TrendingUp } from "lucide-react";

const ResearchPage = () => {
  const [insights, setInsights] = useState(uxResearchInsights);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInsights, setFilteredInsights] = useState(insights);

  useEffect(() => {
    loadResearchData();
  }, []);

  useEffect(() => {
    const filtered = insights.filter(insight =>
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInsights(filtered);
  }, [searchQuery, insights]);

  const loadResearchData = async () => {
    setLoading(true);
    try {
      const response = await mcpService.fetchUXResearchData();
      if (response.success) {
        setInsights(response.data);
      }
    } catch (error) {
      toast({
        title: "データ読み込みエラー",
        description: "UXリサーチデータの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCustomInsights = async () => {
    setLoading(true);
    try {
      const response = await mcpService.generateAIInsights({
        designData: { category: "research" },
        includeExternalData: true,
      });

      if (response.success) {
        const newInsights = response.data.insights.map((insight: any, index: number) => ({
          id: `custom-${Date.now()}-${index}`,
          title: insight.title,
          summary: insight.description,
          category: insight.category,
          insights: insight.recommendations || [],
          source: "ai_generated",
        }));

        setInsights([...newInsights, ...insights]);
        toast({
          title: "カスタムインサイト生成完了",
          description: "AIによる新しいUXインサイトが生成されました",
        });
      }
    } catch (error) {
      toast({
        title: "生成エラー",
        description: "カスタムインサイトの生成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'mobile': return 'bg-blue-100 text-blue-800';
      case 'conversion': return 'bg-green-100 text-green-800';
      case 'ux': return 'bg-purple-100 text-purple-800';
      case 'ui': return 'bg-orange-100 text-orange-800';
      case 'accessibility': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'nngroup.com': return <BookOpen className="h-4 w-4" />;
      case 'abtest.design': return <TrendingUp className="h-4 w-4" />;
      case 'ai_generated': return <Lightbulb className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Deep Research</h1>
        <p className="text-muted-foreground">
          UXリサーチデータと業界のベストプラクティスを統合した深層分析
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="リサーチデータを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={generateCustomInsights} 
          disabled={loading}
          className="bg-mcp-primary hover:bg-mcp-tertiary"
        >
          {loading ? "生成中..." : "AIインサイト生成"}
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="mobile">モバイル</TabsTrigger>
          <TabsTrigger value="conversion">コンバージョン</TabsTrigger>
          <TabsTrigger value="ux">UX</TabsTrigger>
          <TabsTrigger value="accessibility">アクセシビリティ</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base leading-tight">{insight.title}</CardTitle>
                    <div className="flex items-center gap-1 ml-2">
                      {getSourceIcon(insight.source)}
                    </div>
                  </div>
                  <Badge className={getCategoryColor(insight.category)}>
                    {insight.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{insight.summary}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">主要なインサイト:</h4>
                    <ul className="space-y-1">
                      {insight.insights.map((item, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-mcp-primary rounded-full mt-2 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>出典: {insight.source}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2">
                        詳細 <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['mobile', 'conversion', 'ux', 'accessibility'].map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInsights
                .filter(insight => insight.category.toLowerCase() === category)
                .map((insight) => (
                  <Card key={insight.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base leading-tight">{insight.title}</CardTitle>
                        <div className="flex items-center gap-1 ml-2">
                          {getSourceIcon(insight.source)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{insight.summary}</p>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">主要なインサイト:</h4>
                        <ul className="space-y-1">
                          {insight.insights.map((item, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="w-1 h-1 bg-mcp-primary rounded-full mt-2 flex-shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>出典: {insight.source}</span>
                          <Button size="sm" variant="ghost" className="h-6 px-2">
                            詳細 <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </MainLayout>
  );
};

export default ResearchPage;
