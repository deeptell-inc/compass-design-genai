import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Lightbulb, Wand2, FileImage, Link } from "lucide-react";
import ChatMessage, { type ChatMessage as ChatMessageType } from "./ChatMessage";
import ChatInput from "./ChatInput";
import { ModelSelector, type LanguageModel } from "@/components/ui/model-selector";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

interface BrainstormChatProps {
  title?: string;
}

const BrainstormChat = ({ title = "デザインアイデアブレストーミング" }: BrainstormChatProps) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "welcome",
      content:
        "こんにちは！デザインアイデアのブレインストーミングをお手伝いします。デザインについてのアイデア、質問、または課題を共有してください。",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LanguageModel>({
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
  });
  const { toast } = useToast();

  // Figma integration states
  const [figmaFileUrl, setFigmaFileUrl] = useState("");
  const [figmaContext, setFigmaContext] = useState<any>(null);
  const [loadingFigmaContext, setLoadingFigmaContext] = useState(false);

  // Helper function to extract Figma file ID from URL
  const extractFigmaFileId = (url: string): string | null => {
    const match = url.match(/^https?:\/\/(?:www\.)?figma\.com\/(?:file|design|buzz)\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Load Figma design context
  const loadFigmaContext = async () => {
    if (!figmaFileUrl.trim()) {
      toast({
        title: "Figma URLが必要です",
        description: "FigmaファイルのURLを入力してください",
        variant: "destructive",
      });
      return;
    }

    const fileId = extractFigmaFileId(figmaFileUrl);
    if (!fileId) {
      toast({
        title: "無効なFigma URL",
        description: "正しいFigmaファイルのURLを入力してください",
        variant: "destructive",
      });
      return;
    }

    setLoadingFigmaContext(true);
    try {
      const result = await apiService.extractFigmaInsights(fileId) as any;
      if (result.success && result.insights) {
        // Only store essential insights, not the full data
        const essentialInsights = {
          colors: result.insights.colors?.slice(0, 5) || [],
          typography: result.insights.typography?.slice(0, 3) || [],
          components: result.insights.components?.slice(0, 5) || [],
          suggestions: result.insights.suggestions?.slice(0, 3) || []
        };
        
        setFigmaContext({
          fileId,
          url: figmaFileUrl,
          insights: essentialInsights,
        });
        
        toast({
          title: "Figmaデザインを読み込みました",
          description: "デザイン情報がブレストーミングに利用できます",
        });
      } else {
        throw new Error(result.error || 'Failed to load Figma context');
      }
    } catch (error) {
      toast({
        title: "Figmaデザインの読み込みに失敗",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setLoadingFigmaContext(false);
    }
  };

  // Clear Figma context
  const clearFigmaContext = () => {
    setFigmaContext(null);
    setFigmaFileUrl("");
    toast({
      title: "Figmaコンテキストをクリア",
      description: "Figmaデザイン情報が削除されました",
    });
  };

  // アイデア促進トピックの例
  const ideaPrompts = [
    "ユーザーが最初に見る画面についてのアイデアが欲しい",
    "このアプリのカラースキームを考えたい",
    "ナビゲーション構造を改善するアイデアはある？",
    "アクセシビリティを向上させるには？",
    "モバイルでのUXを向上させるには？",
  ];

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: uuidv4(),
      content,
      role: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let responseContent: string;
      
      if (selectedModel.provider === 'openai') {
        if (figmaContext) {
          // Use enhanced brainstorm with compressed Figma context
          const compressedContext = {
            fileId: figmaContext.fileId,
            insights: {
              colors: figmaContext.insights?.colors?.slice(0, 3) || [],
              typography: figmaContext.insights?.typography?.slice(0, 2) || [],
              components: figmaContext.insights?.components?.slice(0, 3) || [],
              suggestions: figmaContext.insights?.suggestions?.slice(0, 2) || []
            }
          };
          
          const result = await apiService.generateBrainstormWithFigma(
            content, 
            selectedModel.id, 
            compressedContext
          ) as { success: boolean; data: { response: string } };
          responseContent = result.success ? result.data.response : generateMockResponseWithFigma(content, selectedModel, figmaContext);
        } else {
          const result = await apiService.generateBrainstormResponse(content, selectedModel.id) as { success: boolean; data: { response: string } };
          responseContent = result.success ? result.data.response : generateMockResponse(content, selectedModel);
        }
      } else {
        responseContent = figmaContext 
          ? generateMockResponseWithFigma(content, selectedModel, figmaContext)
          : generateMockResponse(content, selectedModel);
      }

      const assistantMessage: ChatMessageType = {
        id: uuidv4(),
        content: responseContent,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Brainstorm error:', error);
      const responseContent = generateMockResponse(content, selectedModel);
      const assistantMessage: ChatMessageType = {
        id: uuidv4(),
        content: responseContent,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (model: LanguageModel) => {
    setSelectedModel(model);
    toast({
      title: "モデルを変更しました",
      description: `${model.name}に切り替えました`,
    });
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // モック応答生成
  const generateMockResponse = (message: string, model: LanguageModel): string => {
    const modelResponses: Record<string, string[]> = {
      anthropic: [
        "なるほど、興味深い視点ですね。デザインの観点からいくつか提案があります。まず、...",
        "ユーザーエクスペリエンスを向上させるために、次のようなアプローチを検討してみてはいかがでしょうか？...",
        "ご質問ありがとうございます。この課題に対して、デザイン原則に基づいた解決策としては...",
      ],
      openai: [
        "面白いチャレンジですね。GPT-4oの分析によると、このデザイン課題に対しては以下のようなアプローチが効果的かもしれません...",
        "複数の視点から考えると、次のような解決策が考えられます。まず第一に...",
        "このデザイン問題を解決するために、データ駆動型のアプローチを提案します。具体的には...",
      ],
      gemini: [
        "Geminiの分析によれば、���のケースでは以下のデザインパターンが最も効果的です...",
        "ユーザーのニーズと技術的な実現可能性のバランスを考慮すると、次のようなデザインソリューションが適しています...",
        "興味深い課題ですね。複数の観点から分析した結果、以下のような方向性が考えられます...",
      ],
      other: [
        "興味深い課題ですね。このデザイン問題に対するアプローチとしては...",
        "ユーザー中心設計の原則に基づいて考えると、次のような解決策が考えられます...",
        "この問題に対する創造的なソリューションをいくつか提案させてください...",
      ],
    };

    // モデルのプロバイダーに基づいて応答を選択
    const responses = modelResponses[model.provider] || modelResponses.other;
    const randomIndex = Math.floor(Math.random() * responses.length);
    
    // メッセージの内容に応じた応答を作成
    if (message.toLowerCase().includes("カラー") || message.toLowerCase().includes("色")) {
      return `${responses[randomIndex]}\n\n以下のようなカラースキームはいかがでしょうか：\n\n1. プライマリ: #9b87f5 (紫)\n2. セカンダリ: #6E59A5 (深い紫)\n3. アクセント: #FEC6A1 (ソフトオレンジ)\n4. 背景: #F2FCE2 (淡いグリーン)\n5. テキスト: #1A1F2C (ダークパープル)\n\nこのカラースキームは、モダンでありながら親しみやすく、視覚的な階層を明確にするのに役立ちます。`;
    } else if (message.toLowerCase().includes("ナビゲーション") || message.toLowerCase().includes("メニュー")) {
      return `${responses[randomIndex]}\n\n効果的なナビゲーション構造としては：\n\n1. トップレベル: ダッシュボード、プロジェクト、分析、設定\n2. コンテキストナビ: 現在のページに関連する操作をサイドパネルに表示\n3. パンくずリスト: 特に深い階層構造のナビゲーションに有効\n\nモバイルでは、タブバーを使用して主要な4-5セクションへの素早いアクセスを提供し、その他の機能はハンバーガーメニューにまとめることを推奨します。`;
    } else if (message.toLowerCase().includes("アクセシビリティ")) {
      return `${responses[randomIndex]}\n\nアクセシビリティを向上させるための提案：\n\n1. コントラスト比を確認: テキストとバックグラウンドのコントラスト比がWCAG AAレベル(4.5:1)を満たしているか\n2. キーボード操作: すべての機能がキーボードのみで操作可能にする\n3. スクリーンリーダー対応: 意味のあるalt属性とARIAラベルを使用\n4. フォーカス可視化: キーボード操作時にフォーカスがどこにあるか明確に\n5. フォントサイズ: 最小16px以上を推奨\n\nこれらの変更は、障害を持つユーザーだけでなく、すべてのユーザーにとって使いやすいデザインにつながります。`;
    }

    return responses[randomIndex];
  };

  // Enhanced mock response with Figma context
  const generateMockResponseWithFigma = (message: string, model: LanguageModel, figmaContext: any): string => {
    const baseResponse = generateMockResponse(message, model);
    const insights = figmaContext.insights;
    
    let figmaAnalysis = "\n\n**Figmaデザイン分析に基づく提案:**\n\n";
    
    if (insights.colors && insights.colors.length > 0) {
      figmaAnalysis += `🎨 **現在のカラーパレット**: ${insights.colors.slice(0, 3).join(', ')}\n`;
    }
    
    if (insights.typography && insights.typography.length > 0) {
      figmaAnalysis += `📝 **使用されているフォント**: ${insights.typography.slice(0, 2).join(', ')}\n`;
    }
    
    if (insights.components && insights.components.length > 0) {
      figmaAnalysis += `🧩 **主要コンポーネント**: ${insights.components.slice(0, 3).join(', ')}\n`;
    }
    
    if (insights.suggestions && insights.suggestions.length > 0) {
      figmaAnalysis += `💡 **デザイン洞察**: ${insights.suggestions[0]}\n`;
    }
    
    // Add context-specific suggestions based on the message
    if (message.toLowerCase().includes("改善") || message.toLowerCase().includes("向上")) {
      figmaAnalysis += "\n**改善提案**:\n";
      figmaAnalysis += "- 現在のデザインシステムと一貫性を保ちながら、ユーザビリティを向上\n";
      figmaAnalysis += "- 既存のコンポーネントを活用した効率的な実装\n";
    }
    
    if (message.toLowerCase().includes("カラー") || message.toLowerCase().includes("色")) {
      figmaAnalysis += "\n**カラー戦略**:\n";
      figmaAnalysis += "- 現在のパレットを基にした調和の取れた拡張\n";
      figmaAnalysis += "- アクセシビリティを考慮したコントラスト比の確認\n";
    }
    
    return baseResponse + figmaAnalysis;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb size={20} className="text-mcp-primary" />
            {title}
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ModelSelector onModelChange={handleModelChange} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2 mb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">考え中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* プロンプト提案 */}
        {messages.length < 2 && (
          <div className="px-4 py-2">
            <p className="text-sm text-muted-foreground mb-2">よくある質問例:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {ideaPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt)}
                  className="flex items-center gap-1 whitespace-normal text-left h-auto"
                >
                  <Wand2 size={14} />
                  <span className="text-xs">{prompt}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/*  Section */}
        <div className="px-4 py-3 border-t bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileImage size={16} className="text-mcp-primary" />
              Figma連携
            </div>
            
            {figmaContext ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    <Link size={12} className="mr-1" />
                    デザイン読み込み済み
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFigmaContext}
                    className="text-xs h-6 px-2"
                  >
                    クリア
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {figmaContext.insights?.components?.length || 0}個のコンポーネント、
                  {figmaContext.insights?.colors?.length || 0}色のパレット
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="FigmaファイルのURLを入力..."
                    value={figmaFileUrl}
                    onChange={(e) => setFigmaFileUrl(e.target.value)}
                    className="text-sm h-8"
                    disabled={loadingFigmaContext}
                  />
                  <Button
                    size="sm"
                    onClick={loadFigmaContext}
                    disabled={loadingFigmaContext || !figmaFileUrl.trim()}
                    className="h-8 px-3 text-xs"
                  >
                    {loadingFigmaContext ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "読み込み"
                    )}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Figmaデザインを読み込むと、デザインコンテキストを考慮した提案が可能になります
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BrainstormChat;
