import React, { useState } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Code, Download, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

interface CodeGenerationRequest {
  figmaFileKey: string;
  figmaNodeId: string;
  framework: string;
  styling: string;
  aiProvider: string;
  options: {
    responsive: boolean;
    accessibility: boolean;
    typescript: boolean;
  };
}

interface GeneratedCode {
  id: string;
  code: string;
  framework: string;
  styling: string;
  aiProvider: string;
  timestamp: Date;
  status: 'generating' | 'completed' | 'error';
}

const CodeGenerationEnhancedPage: React.FC = () => {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [framework, setFramework] = useState("react");
  const [styling, setStyling] = useState("tailwind");
  const [aiProvider, setAiProvider] = useState("openai");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);

  const handleGenerateCode = async () => {
    if (!figmaUrl.trim()) {
      toast({
        title: "エラー",
        description: "FigmaのURLを入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const codeId = Date.now().toString();
    
    const newCode: GeneratedCode = {
      id: codeId,
      code: "",
      framework,
      styling,
      aiProvider,
      timestamp: new Date(),
      status: 'generating'
    };

    setGeneratedCodes(prev => [newCode, ...prev]);

    try {
      const request: CodeGenerationRequest = {
        figmaFileKey: extractFileKey(figmaUrl),
        figmaNodeId: "0:1",
        framework,
        styling,
        aiProvider,
        options: {
          responsive: true,
          accessibility: true,
          typescript: framework === 'react',
        },
      };

      const result = await apiService.generateCodeWithAI(request);
      
      if (result.success) {
        setGeneratedCodes(prev => 
          prev.map(code => 
            code.id === codeId 
              ? { ...code, code: result.data.code, status: 'completed' }
              : code
          )
        );

        toast({
          title: "成功",
          description: "コードが生成されました！",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Code generation error:', error);
      
      setGeneratedCodes(prev => 
        prev.map(code => 
          code.id === codeId 
            ? { ...code, status: 'error' }
            : code
        )
      );

      toast({
        title: "エラー",
        description: "コード生成中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const extractFileKey = (url: string): string => {
    const match = url.match(/\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : url;
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "コピー完了",
      description: "コードがクリップボードにコピーされました。",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Code Generation</h1>
          <p className="text-muted-foreground">
            FigmaデザインからAIを使用してコードを生成します（OpenAI & Anthropic対応）
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              コード生成設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="figma-url" className="text-sm font-medium">
                FigmaファイルURL
              </label>
              <Textarea
                id="figma-url"
                placeholder="https://www.figma.com/file/..."
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">フレームワーク</label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">スタイリング</label>
                <Select value={styling} onValueChange={setStyling}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="styled-components">Styled Components</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">AIプロバイダー</label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                    <SelectItem value="anthropic">Claude 3.5 Sonnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateCode}
              disabled={isGenerating || !figmaUrl.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  コード生成中...
                </>
              ) : (
                <>
                  <Code className="mr-2 h-4 w-4" />
                  コードを生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedCodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>生成されたコード</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedCodes.map((codeItem) => (
                  <div key={codeItem.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          {codeItem.timestamp.toLocaleString('ja-JP')}
                        </p>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline">{codeItem.framework}</Badge>
                          <Badge variant="outline">{codeItem.styling}</Badge>
                          <Badge variant="outline">{codeItem.aiProvider}</Badge>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          codeItem.status === 'completed' ? 'default' :
                          codeItem.status === 'generating' ? 'secondary' : 'destructive'
                        }
                      >
                        {codeItem.status === 'completed' ? '完了' :
                         codeItem.status === 'generating' ? '生成中' : 'エラー'}
                      </Badge>
                    </div>

                    {codeItem.status === 'generating' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        コードを生成しています...
                      </div>
                    )}

                    {codeItem.status === 'completed' && codeItem.code && (
                      <div className="space-y-3">
                        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{codeItem.code}</code>
                        </pre>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(codeItem.code)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            コピー
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            ダウンロード
                          </Button>
                        </div>
                      </div>
                    )}

                    {codeItem.status === 'error' && (
                      <p className="text-sm text-red-600">
                        コード生成中にエラーが発生しました。もう一度お試しください。
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default CodeGenerationEnhancedPage;
