import React, { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useCompassAnalytics } from "@/hooks/useCompassAnalytics";
import {
  Brain,
  Lightbulb,
  MessageSquare,
  Palette,
  Zap,
  Download,
  Share2,
  RefreshCw,
  Plus,
  X,
  Star,
  Clock,
  Users,
} from "lucide-react";

interface BrainstormSession {
  id: string;
  title: string;
  description: string;
  topic: string;
  participants: string[];
  aiTools: ('claude' | 'chatgpt' | 'figma')[];
  createdAt: Date;
  ideas: BrainstormIdea[];
  phase: 'divergent' | 'convergent' | 'analysis';
}

interface BrainstormIdea {
  id: string;
  content: string;
  source: 'user' | 'claude' | 'chatgpt' | 'figma';
  category: string;
  tags: string[];
  rating: number;
  comments: string[];
  createdAt: Date;
}

const BrainstormingPage = () => {
  const analytics = useCompassAnalytics({
    apiKey: 'brainstorming-page',
    debug: true,
    autoTrackPageViews: true,
  });

  const [currentSession, setCurrentSession] = useState<BrainstormSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newIdea, setNewIdea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [activeAITool, setActiveAITool] = useState<'claude' | 'chatgpt' | 'figma' | null>(null);

  // Session creation form
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    topic: "",
    participants: [] as string[],
    aiTools: [] as ('claude' | 'chatgpt' | 'figma')[],
  });

  const [newParticipant, setNewParticipant] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const categories = [
    "general",
    "feature",
    "ui_ux",
    "technical",
    "business",
    "marketing",
    "user_story",
  ];

  const aiToolConfig = {
    claude: {
      name: "Claude",
      description: "戦略的思考とコンテンツ生成",
      icon: Brain,
      color: "from-orange-400 to-red-500",
    },
    chatgpt: {
      name: "ChatGPT",
      description: "創造的アイデアと問題解決",
      icon: MessageSquare,
      color: "from-green-400 to-blue-500",
    },
    figma: {
      name: "Figma",
      description: "ビジュアルコンセプトとUI案",
      icon: Palette,
      color: "from-purple-400 to-pink-500",
    },
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.ideas]);

  const createNewSession = () => {
    if (!sessionForm.title || !sessionForm.topic) {
      toast({
        title: "必須項目が未入力です",
        description: "セッション名とトピックを入力してください。",
        variant: "destructive",
      });
      return;
    }

    const newSession: BrainstormSession = {
      id: `session_${Date.now()}`,
      title: sessionForm.title,
      description: sessionForm.description,
      topic: sessionForm.topic,
      participants: sessionForm.participants,
      aiTools: sessionForm.aiTools,
      createdAt: new Date(),
      ideas: [],
      phase: 'divergent',
    };

    setCurrentSession(newSession);
    analytics.trackCustomEvent('brainstorm_session_created', {
      aiTools: sessionForm.aiTools.length,
      participants: sessionForm.participants.length,
    });

    toast({
      title: "セッションを開始しました",
      description: `${sessionForm.title}のブレインストーミングを開始します。`,
    });

    // Reset form
    setSessionForm({
      title: "",
      description: "",
      topic: "",
      participants: [],
      aiTools: [],
    });
  };

  const addParticipant = () => {
    if (newParticipant.trim() && !sessionForm.participants.includes(newParticipant.trim())) {
      setSessionForm(prev => ({
        ...prev,
        participants: [...prev.participants, newParticipant.trim()],
      }));
      setNewParticipant("");
    }
  };

  const removeParticipant = (participant: string) => {
    setSessionForm(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== participant),
    }));
  };

  const toggleAITool = (tool: 'claude' | 'chatgpt' | 'figma') => {
    setSessionForm(prev => ({
      ...prev,
      aiTools: prev.aiTools.includes(tool)
        ? prev.aiTools.filter(t => t !== tool)
        : [...prev.aiTools, tool],
    }));
  };

  const addIdea = (content: string, source: 'user' | 'claude' | 'chatgpt' | 'figma' = 'user') => {
    if (!currentSession || !content.trim()) return;

    const newIdeaObj: BrainstormIdea = {
      id: `idea_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      content: content.trim(),
      source,
      category: selectedCategory,
      tags: [],
      rating: 0,
      comments: [],
      createdAt: new Date(),
    };

    setCurrentSession(prev => prev ? {
      ...prev,
      ideas: [...prev.ideas, newIdeaObj],
    } : null);

    analytics.trackCustomEvent('idea_added', {
      source,
      category: selectedCategory,
      sessionId: currentSession.id,
    });

    setNewIdea("");
  };

  const generateAIIdeas = async (tool: 'claude' | 'chatgpt' | 'figma') => {
    if (!currentSession) return;

    setIsLoading(true);
    setActiveAITool(tool);
    analytics.trackCustomEvent('ai_ideas_requested', { tool, sessionId: currentSession.id });

    try {
      // Mock AI API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockIdeas = {
        claude: [
          "ユーザージャーニーを可視化する新しいダッシュボード機能",
          "デザインシステムの一貫性を自動チェックするAI機能",
          "コラボレーションを促進するリアルタイムコメント機能",
          "アクセシビリティを向上させる自動修正提案",
        ],
        chatgpt: [
          "ゲーミフィケーション要素を取り入れたプロダクト体験",
          "パーソナライゼーションを活用したカスタムワークフロー",
          "クリエイティブなインタラクションパターンの提案",
          "ユーザーエンゲージメントを高める通知システム",
        ],
        figma: [
          "ダークモード対応のモダンなUIデザイン",
          "モバイルファーストのレスポンシブレイアウト",
          "ブランドアイデンティティを反映したカラーシステム",
          "マイクロインタラクションを活用したUXデザイン",
        ],
      };

      const ideas = mockIdeas[tool];
      ideas.forEach(idea => {
        setTimeout(() => addIdea(idea, tool), Math.random() * 1000);
      });

      toast({
        title: `${aiToolConfig[tool].name}からアイデアを生成しました`,
        description: `${ideas.length}個の新しいアイデアが追加されました。`,
      });
    } catch (error) {
      toast({
        title: "アイデア生成に失敗しました",
        description: "もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setActiveAITool(null);
    }
  };

  const rateIdea = (ideaId: string, rating: number) => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      ideas: prev.ideas.map(idea =>
        idea.id === ideaId ? { ...idea, rating } : idea
      ),
    } : null);

    analytics.trackCustomEvent('idea_rated', { ideaId, rating });
  };

  const exportSession = () => {
    if (!currentSession) return;

    const exportData = {
      ...currentSession,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstorm_${currentSession.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    analytics.trackCustomEvent('brainstorm_session_exported', {
      sessionId: currentSession.id,
      ideasCount: currentSession.ideas.length,
    });

    toast({
      title: "セッションをエクスポートしました",
      description: "ファイルがダウンロードされました。",
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'claude':
        return <Brain className="h-4 w-4" />;
      case 'chatgpt':
        return <MessageSquare className="h-4 w-4" />;
      case 'figma':
        return <Palette className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'claude':
        return 'border-orange-200 bg-orange-50';
      case 'chatgpt':
        return 'border-green-200 bg-green-50';
      case 'figma':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!currentSession) {
    return (
      <MainLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">ブレインストーミング</h1>
          <p className="text-muted-foreground">
            Claude、ChatGPT、Figmaを連携させたAI支援ブレインストーミングセッション
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              新しいセッションを開始
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-title">セッション名 *</Label>
                <Input
                  id="session-title"
                  placeholder="例: プロダクト改善アイデア"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="session-topic">トピック *</Label>
                <Input
                  id="session-topic"
                  placeholder="例: ユーザーエクスペリエンスの向上"
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="session-description">説明</Label>
                <Textarea
                  id="session-description"
                  placeholder="セッションの背景や目的を記述してください..."
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>参加者</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="参加者名を入力"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                  />
                  <Button onClick={addParticipant} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sessionForm.participants.map((participant, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                           onClick={() => removeParticipant(participant)}>
                      {participant} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>AI連携ツール</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  {Object.entries(aiToolConfig).map(([key, config]) => {
                    const isSelected = sessionForm.aiTools.includes(key as any);
                    return (
                      <div
                        key={key}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleAITool(key as any)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <config.icon className="h-5 w-5" />
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Button onClick={createNewSession} className="w-full" size="lg">
              <Zap className="mr-2 h-5 w-5" />
              セッション開始
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{currentSession.title}</h1>
            <p className="text-muted-foreground">{currentSession.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                開始: {currentSession.createdAt.toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                {currentSession.ideas.length} アイデア
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {currentSession.participants.length + 1} 参加者
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSession}>
              <Download className="mr-2 h-4 w-4" />
              エクスポート
            </Button>
            <Button variant="outline" onClick={() => setCurrentSession(null)}>
              新しいセッション
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Tools Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI連携ツール</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSession.aiTools.map((tool) => {
                const config = aiToolConfig[tool];
                return (
                  <Button
                    key={tool}
                    onClick={() => generateAIIdeas(tool)}
                    disabled={isLoading}
                    variant={activeAITool === tool ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    {isLoading && activeAITool === tool ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <config.icon className="mr-2 h-4 w-4" />
                        {config.name}でアイデア生成
                      </>
                    )}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">カテゴリ</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Ideas Panel */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                アイデア一覧
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {currentSession.ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className={`p-4 border rounded-lg ${getSourceColor(idea.source)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(idea.source)}
                        <Badge variant="secondary">{idea.source}</Badge>
                        <Badge variant="outline">{idea.category}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 cursor-pointer ${
                              star <= idea.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                            onClick={() => rateIdea(idea.id, star)}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm mb-2">{idea.content}</p>
                    <div className="text-xs text-gray-500">
                      {idea.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="新しいアイデアを入力..."
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addIdea(newIdea);
                      }
                    }}
                  />
                  <Button onClick={() => addIdea(newIdea)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default BrainstormingPage;