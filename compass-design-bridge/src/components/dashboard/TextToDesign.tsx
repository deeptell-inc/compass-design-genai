import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Download, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

interface GeneratedDesign {
  id: string;
  prompt: string;
  imageUrl: string;
  figmaUrl?: string;
  timestamp: Date;
  status: 'generating' | 'completed' | 'error';
}

const TextToDesign: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      toast({
        title: "エラー",
        description: "デザインの説明を入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const designId = Date.now().toString();
    
    const newDesign: GeneratedDesign = {
      id: designId,
      prompt: prompt.trim(),
      imageUrl: "",
      timestamp: new Date(),
      status: 'generating'
    };

    setGeneratedDesigns(prev => [newDesign, ...prev]);

    try {
      const result = await apiService.generateDesign(prompt.trim());
      
      if (result.success) {
        setGeneratedDesigns(prev => 
          prev.map(design => 
            design.id === designId 
              ? { ...design, imageUrl: result.data.imageUrl, status: 'completed' }
              : design
          )
        );

        toast({
          title: "成功",
          description: "デザインが生成されました！",
        });
      } else {
        throw new Error(result.error);
      }

      setPrompt("");
    } catch (error) {
      console.error('Design generation error:', error);
      
      setGeneratedDesigns(prev => 
        prev.map(design => 
          design.id === designId 
            ? { ...design, status: 'error' }
            : design
        )
      );

      toast({
        title: "エラー",
        description: "デザイン生成中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportToFigma = async (design: GeneratedDesign) => {
    try {
      const result = await apiService.exportToFigma(design.id, design.imageUrl, design.prompt);
      
      if (result.success) {
        setGeneratedDesigns(prev => 
          prev.map(d => 
            d.id === design.id 
              ? { ...d, figmaUrl: result.data.figmaUrl }
              : d
          )
        );

        toast({
          title: "成功",
          description: "Figmaにエクスポートされました！",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Figma export error:', error);
      toast({
        title: "エラー",
        description: "Figmaエクスポート中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Text to Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="design-prompt" className="text-sm font-medium">
              デザインの説明
            </label>
            <Textarea
              id="design-prompt"
              placeholder="例: モダンなランディングページのデザイン。青とグレーの配色で、ヒーローセクション、機能紹介、お客様の声、CTAボタンを含む"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <Button 
            onClick={handleGenerateDesign}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                デザイン生成中...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                デザインを生成
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedDesigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>生成されたデザイン</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedDesigns.map((design) => (
                <div key={design.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {design.timestamp.toLocaleString('ja-JP')}
                      </p>
                      <p className="text-sm">{design.prompt}</p>
                    </div>
                    <Badge 
                      variant={
                        design.status === 'completed' ? 'default' :
                        design.status === 'generating' ? 'secondary' : 'destructive'
                      }
                    >
                      {design.status === 'completed' ? '完了' :
                       design.status === 'generating' ? '生成中' : 'エラー'}
                    </Badge>
                  </div>

                  {design.status === 'generating' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      デザインを生成しています...
                    </div>
                  )}

                  {design.status === 'completed' && design.imageUrl && (
                    <div className="space-y-3">
                      <img 
                        src={design.imageUrl} 
                        alt={`Generated design: ${design.prompt}`}
                        className="w-full max-w-md rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          プレビュー
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          ダウンロード
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleExportToFigma(design)}
                          disabled={!!design.figmaUrl}
                        >
                          {design.figmaUrl ? 'Figmaにエクスポート済み' : 'Figmaにエクスポート'}
                        </Button>
                      </div>
                      {design.figmaUrl && (
                        <a 
                          href={design.figmaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Figmaで開く →
                        </a>
                      )}
                    </div>
                  )}

                  {design.status === 'error' && (
                    <p className="text-sm text-red-600">
                      デザイン生成中にエラーが発生しました。もう一度お試しください。
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TextToDesign;
