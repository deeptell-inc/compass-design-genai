import React, { useState } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useCompassAnalytics } from "@/hooks/useCompassAnalytics";
import {
  Target,
  Users,
  MapPin,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  Download,
  RefreshCw,
} from "lucide-react";

interface MissionVisionData {
  mission: string;
  vision: string;
  values: string[];
  objectives: string[];
}

interface PersonaData {
  name: string;
  age: string;
  occupation: string;
  demographics: string;
  painPoints: string[];
  goals: string[];
  behaviors: string[];
  preferences: string[];
}

interface PositioningData {
  targetMarket: string;
  valueProposition: string;
  competitiveAdvantage: string;
  marketSize: string;
  competitors: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  differentiation: string[];
}

const BusinessStrategyPage = () => {
  const analytics = useCompassAnalytics({
    apiKey: 'business-strategy-page',
    debug: true,
    autoTrackPageViews: true,
  });

  const [activeTab, setActiveTab] = useState("mission-vision");
  const [isLoading, setIsLoading] = useState(false);

  // Mission & Vision State
  const [missionVisionData, setMissionVisionData] = useState<MissionVisionData>({
    mission: "",
    vision: "",
    values: [],
    objectives: [],
  });

  // Persona State
  const [personaData, setPersonaData] = useState<PersonaData>({
    name: "",
    age: "",
    occupation: "",
    demographics: "",
    painPoints: [],
    goals: [],
    behaviors: [],
    preferences: [],
  });

  // Positioning State
  const [positioningData, setPositioningData] = useState<PositioningData>({
    targetMarket: "",
    valueProposition: "",
    competitiveAdvantage: "",
    marketSize: "",
    competitors: [],
    differentiation: [],
  });

  // AI-generated suggestions
  const [aiSuggestions, setAiSuggestions] = useState<{
    mission?: string[];
    vision?: string[];
    personas?: any[];
    positioning?: any[];
  }>({});

  const handleGenerateAISuggestions = async (type: string) => {
    setIsLoading(true);
    analytics.trackCustomEvent('ai_suggestion_requested', { type });

    try {
      // Mock AI API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSuggestions = {
        mission: [
          "プロダクトデザインとテクノロジーの力で、ユーザーの創造性を解放し、より良い体験を生み出すこと",
          "デザインと開発の境界をなくし、チームの生産性を最大化してイノベーションを加速すること",
          "AIとデザインの融合により、誰もが直感的に美しいプロダクトを作れる世界を実現すること",
        ],
        vision: [
          "2030年までに、世界中のデザイナーと開発者が最も信頼するデザイン開発プラットフォームになる",
          "デザインから実装までの時間を90%短縮し、クリエイターが本質的な価値創造に集中できる環境を提供する",
          "ノーコード/ローコードの先駆者として、技術的背景に関係なく誰でもプロダクトを作れる未来を築く",
        ],
        personas: [
          {
            name: "デザイナー田中さん",
            age: "28-35",
            occupation: "UX/UIデザイナー",
            painPoints: ["デザインと実装の乖離", "開発者とのコミュニケーション", "反復作業の多さ"],
            goals: ["効率的なデザイン→開発フロー", "一貫性のあるデザインシステム", "ユーザー体験の向上"],
          },
          {
            name: "開発者佐藤さん",
            age: "25-32",
            occupation: "フロントエンド開発者",
            painPoints: ["デザイン仕様の解釈", "コンポーネントの再利用性", "品質とスピードの両立"],
            goals: ["高品質なコード生成", "保守性の高い実装", "開発効率の向上"],
          },
        ],
        positioning: [
          {
            category: "競合分析",
            suggestions: [
              "Figmaとの差別化: AIによる自動コード生成機能",
              "WebflowやFramer対比: 企業向け機能とスケーラビリティ",
              "開発ツール（VS Code拡張）としての強み",
            ],
          },
          {
            category: "バリュープロポジション",
            suggestions: [
              "デザイン→開発の時間を80%削減",
              "AIによる最適化されたコード品質",
              "デザインシステムの自動適用",
            ],
          },
        ],
      };

      setAiSuggestions(prev => ({ ...prev, [type]: mockSuggestions[type as keyof typeof mockSuggestions] }));
      
      toast({
        title: "AI提案が生成されました",
        description: `${type}に関する提案を確認してください。`,
      });
    } catch (error) {
      toast({
        title: "提案生成に失敗しました",
        description: "もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProgress = () => {
    const data = {
      missionVision: missionVisionData,
      persona: personaData,
      positioning: positioningData,
    };
    
    localStorage.setItem('business_strategy_data', JSON.stringify(data));
    analytics.trackCustomEvent('business_strategy_saved', { activeTab });
    
    toast({
      title: "進捗が保存されました",
      description: "データがローカルに保存されました。",
    });
  };

  const handleExportData = () => {
    const data = {
      missionVision: missionVisionData,
      persona: personaData,
      positioning: positioningData,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business_strategy.json';
    a.click();
    URL.revokeObjectURL(url);

    analytics.trackCustomEvent('business_strategy_exported', { format: 'json' });
    
    toast({
      title: "データをエクスポートしました",
      description: "ファイルがダウンロードされました。",
    });
  };

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<any>>, key: string, value: string) => {
    if (value.trim()) {
      setter((prev: any) => ({
        ...prev,
        [key]: [...prev[key], value.trim()],
      }));
    }
  };

  const removeArrayItem = (setter: React.Dispatch<React.SetStateAction<any>>, key: string, index: number) => {
    setter((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">ビジネス戦略策定</h1>
        <p className="text-muted-foreground">
          Mission/Vision策定、ペルソナ設計、ポジショニング分析をAI支援で効率的に行えます
        </p>
      </div>

      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          <Button 
            onClick={() => handleGenerateAISuggestions(activeTab)}
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                AI提案生成中...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                AI提案を生成
              </>
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveProgress}>
            <CheckCircle className="mr-2 h-4 w-4" />
            進捗保存
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mission-vision" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Mission・Vision
          </TabsTrigger>
          <TabsTrigger value="persona" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            ペルソナ設計
          </TabsTrigger>
          <TabsTrigger value="positioning" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            ポジショニング
          </TabsTrigger>
        </TabsList>

        {/* Mission & Vision Tab */}
        <TabsContent value="mission-vision" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mission Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="組織の存在意義・使命を記述してください..."
                  value={missionVisionData.mission}
                  onChange={(e) => setMissionVisionData(prev => ({ ...prev, mission: e.target.value }))}
                  rows={4}
                />
                
                <div>
                  <Label className="text-sm font-medium">Core Values</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {missionVisionData.values.map((value, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" 
                             onClick={() => removeArrayItem(setMissionVisionData, 'values', index)}>
                        {value} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="価値観を入力してEnterで追加"
                    className="mt-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem(setMissionVisionData, 'values', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vision Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="将来のあるべき姿・ビジョンを記述してください..."
                  value={missionVisionData.vision}
                  onChange={(e) => setMissionVisionData(prev => ({ ...prev, vision: e.target.value }))}
                  rows={4}
                />
                
                <div>
                  <Label className="text-sm font-medium">Strategic Objectives</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {missionVisionData.objectives.map((objective, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer"
                             onClick={() => removeArrayItem(setMissionVisionData, 'objectives', index)}>
                        {objective} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="戦略目標を入力してEnterで追加"
                    className="mt-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem(setMissionVisionData, 'objectives', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions for Mission/Vision */}
          {aiSuggestions.mission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI提案: Mission Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiSuggestions.mission.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                         onClick={() => setMissionVisionData(prev => ({ ...prev, mission: suggestion }))}>
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {aiSuggestions.vision && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI提案: Vision Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiSuggestions.vision.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                         onClick={() => setMissionVisionData(prev => ({ ...prev, vision: suggestion }))}>
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Persona Tab */}
        <TabsContent value="persona" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ペルソナ基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="persona-name">ペルソナ名</Label>
                  <Input
                    id="persona-name"
                    placeholder="田中太郎"
                    value={personaData.name}
                    onChange={(e) => setPersonaData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="persona-age">年齢</Label>
                  <Input
                    id="persona-age"
                    placeholder="28-35歳"
                    value={personaData.age}
                    onChange={(e) => setPersonaData(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="persona-occupation">職業</Label>
                  <Input
                    id="persona-occupation"
                    placeholder="UX/UIデザイナー"
                    value={personaData.occupation}
                    onChange={(e) => setPersonaData(prev => ({ ...prev, occupation: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="persona-demographics">デモグラフィック</Label>
                <Textarea
                  id="persona-demographics"
                  placeholder="性別、居住地、収入、学歴などの属性情報..."
                  value={personaData.demographics}
                  onChange={(e) => setPersonaData(prev => ({ ...prev, demographics: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ペインポイント・課題</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {personaData.painPoints.map((point, index) => (
                    <Badge key={index} variant="destructive" className="cursor-pointer"
                           onClick={() => removeArrayItem(setPersonaData, 'painPoints', index)}>
                      {point} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="課題を入力してEnterで追加"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem(setPersonaData, 'painPoints', (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ゴール・目標</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {personaData.goals.map((goal, index) => (
                    <Badge key={index} variant="default" className="cursor-pointer"
                           onClick={() => removeArrayItem(setPersonaData, 'goals', index)}>
                      {goal} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="目標を入力してEnterで追加"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem(setPersonaData, 'goals', (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions for Personas */}
          {aiSuggestions.personas && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI提案: ペルソナテンプレート
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiSuggestions.personas.map((persona, index) => (
                    <div key={index} className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                         onClick={() => setPersonaData({
                           name: persona.name,
                           age: persona.age,
                           occupation: persona.occupation,
                           demographics: '',
                           painPoints: persona.painPoints,
                           goals: persona.goals,
                           behaviors: [],
                           preferences: [],
                         })}>
                      <h4 className="font-semibold">{persona.name}</h4>
                      <p className="text-sm text-gray-600">{persona.age} • {persona.occupation}</p>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-red-600">課題:</p>
                          <p className="text-xs">{persona.painPoints.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-600">目標:</p>
                          <p className="text-xs">{persona.goals.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Positioning Tab */}
        <TabsContent value="positioning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>市場ポジショニング</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="target-market">ターゲット市場</Label>
                  <Input
                    id="target-market"
                    placeholder="B2B SaaS、デザインツール市場"
                    value={positioningData.targetMarket}
                    onChange={(e) => setPositioningData(prev => ({ ...prev, targetMarket: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="value-proposition">バリュープロポジション</Label>
                  <Textarea
                    id="value-proposition"
                    placeholder="顧客に提供する独自の価値..."
                    value={positioningData.valueProposition}
                    onChange={(e) => setPositioningData(prev => ({ ...prev, valueProposition: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="competitive-advantage">競合優位性</Label>
                  <Textarea
                    id="competitive-advantage"
                    placeholder="競合他社との差別化要因..."
                    value={positioningData.competitiveAdvantage}
                    onChange={(e) => setPositioningData(prev => ({ ...prev, competitiveAdvantage: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>市場分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="market-size">市場規模</Label>
                  <Input
                    id="market-size"
                    placeholder="例: $10B TAM, $1B SAM"
                    value={positioningData.marketSize}
                    onChange={(e) => setPositioningData(prev => ({ ...prev, marketSize: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">差別化要因</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {positioningData.differentiation.map((factor, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer"
                             onClick={() => removeArrayItem(setPositioningData, 'differentiation', index)}>
                        {factor} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="差別化要因を入力してEnterで追加"
                    className="mt-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addArrayItem(setPositioningData, 'differentiation', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions for Positioning */}
          {aiSuggestions.positioning && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI提案: ポジショニング戦略
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiSuggestions.positioning.map((section, index) => (
                    <div key={index}>
                      <h4 className="font-semibold mb-2">{section.category}</h4>
                      <div className="space-y-2">
                        {section.suggestions.map((suggestion: string, suggestionIndex: number) => (
                          <div key={suggestionIndex} className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default BusinessStrategyPage;