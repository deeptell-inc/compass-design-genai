import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const FigmaApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const { token } = useAuth();

  // Figma APIキーを取得
  const fetchApiKey = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/figmaKey`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success && result.data.fullKey) {
        setApiKey(result.data.fullKey);
        setHasExistingKey(true);
      }
    } catch (error) {
      console.error('Failed to fetch Figma API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Figma APIキーを保存
  const saveApiKey = async () => {
    if (!token || !apiKey.trim()) {
      toast({
        title: "エラー",
        description: "Figma APIキーを入力してください",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/figmaKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key: apiKey }),
      });

      const result = await response.json();
      if (result.success) {
        setHasExistingKey(true);
        toast({
          title: "保存完了",
          description: "Figma APIキーが正常に保存されました",
        });
      } else {
        toast({
          title: "保存エラー",
          description: result.error || "APIキーの保存に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save Figma API key:', error);
      toast({
        title: "エラー",
        description: "サーバーとの通信に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, [token]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Figma API キー
        </CardTitle>
        <CardDescription>
          FigmaのPersonal Access Tokenを設定してください。
          <br />
          <a 
            href="https://www.figma.com/developers/api#access-tokens" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            こちら
          </a>
          から取得できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="figma-api-key">Figma API キー</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="figma-api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Figma APIキーを入力してください"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button 
              onClick={saveApiKey} 
              disabled={isSaving || !apiKey.trim()}
              className="shrink-0"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </div>
        </div>
        
        {hasExistingKey && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Figma APIキーが設定されています
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>• APIキーは暗号化されて安全に保存されます</p>
          <p>• このキーはFigmaデザインファイルにアクセスするために使用されます</p>
          <p>• キーは個人用アクセストークンである必要があります</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FigmaApiKeyManager; 