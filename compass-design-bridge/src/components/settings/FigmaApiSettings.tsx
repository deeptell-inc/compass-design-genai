import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Figma,
  Key,
  Check,
  X,
  Eye,
  EyeOff,
  TestTube,
  Save,
  AlertCircle,
} from "lucide-react";

interface FigmaApiSettingsProps {
  className?: string;
}

interface FigmaSettings {
  apiKey: string;
  isConnected: boolean;
  lastTested: string | null;
  userInfo?: {
    name: string;
    email: string;
    img_url: string;
  };
}

const FigmaApiSettings = ({ className }: FigmaApiSettingsProps) => {
  const { user, updateUser } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [figmaUserInfo, setFigmaUserInfo] = useState<FigmaSettings['userInfo'] | null>(null);
  const [lastTested, setLastTested] = useState<string | null>(null);

  // Load saved Figma settings from server
  useEffect(() => {
    loadFigmaSettings();
  }, [user]);

  const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3002';

  const loadFigmaSettings = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/figmaKey/${encodeURIComponent(user.email)}`, {
        headers: {
          'Authorization': `Bearer ${user.token || 'mock-token'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasApiKey) {
          setIsConnected(true);
          setFigmaUserInfo(data.figmaUserInfo);
          setLastTested(data.lastUpdated);
          setApiKey("••••••••••••••••"); // Mask the actual key
        }
      } else if (response.status !== 404) {
        console.error('Failed to load Figma settings:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading Figma settings:', error);
      // Fallback to localStorage for development
      const savedSettings = localStorage.getItem('figmaSettings');
      if (savedSettings) {
        try {
          const settings: FigmaSettings = JSON.parse(savedSettings);
          setApiKey(settings.apiKey || "");
          setIsConnected(settings.isConnected || false);
          setLastTested(settings.lastTested);
          setFigmaUserInfo(settings.userInfo || null);
        } catch (error) {
          console.error('Failed to parse Figma settings:', error);
        }
      }
    }
  };

  const saveSettings = (settings: FigmaSettings) => {
    localStorage.setItem('figmaSettings', JSON.stringify(settings));
  };

  const testFigmaConnection = async () => {
    if (!apiKey.trim() || apiKey.includes("•")) {
      toast({
        title: "エラー",
        description: "FigmaのAPIキーを入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "エラー",
        description: "ユーザー情報が見つかりません",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);

    try {
      // Save and test API key via server
      const response = await fetch(`${API_BASE_URL}/api/figmaKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || 'mock-token'}`,
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          userId: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setIsConnected(true);
        setFigmaUserInfo(data.figmaUserInfo);
        setLastTested(new Date().toISOString());

        // Also save to localStorage as backup
        const settings: FigmaSettings = {
          apiKey: apiKey.trim(),
          isConnected: true,
          lastTested: new Date().toISOString(),
          userInfo: data.figmaUserInfo,
        };
        saveSettings(settings);

        toast({
          title: "接続成功",
          description: `Figmaアカウント「${data.figmaUserInfo.name}」に接続しました`,
        });

        // Reload settings from server
        await loadFigmaSettings();
      }

    } catch (error) {
      console.error('Figma connection test failed:', error);
      
      setIsConnected(false);
      setFigmaUserInfo(null);

      toast({
        title: "接続失敗",
        description: error.message || "Figma APIキーが無効です。正しいキーを入力してください。",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveApiKey = async () => {
    // For server-based storage, we use testFigmaConnection which saves and tests
    await testFigmaConnection();
  };

  const handleClearSettings = async () => {
    if (!user?.email) return;

    try {
      // Delete from server
      const response = await fetch(`${API_BASE_URL}/api/figmaKey/${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token || 'mock-token'}`,
        },
      });

      if (response.ok) {
        setApiKey("");
        setIsConnected(false);
        setFigmaUserInfo(null);
        setLastTested(null);
        localStorage.removeItem('figmaSettings');
        
        toast({
          title: "設定をクリア",
          description: "Figma API設定をクリアしました",
        });
      } else {
        throw new Error('Failed to delete settings from server');
      }
    } catch (error) {
      console.error('Failed to clear settings:', error);
      // Fallback to local clear
      setApiKey("");
      setIsConnected(false);
      setFigmaUserInfo(null);
      setLastTested(null);
      localStorage.removeItem('figmaSettings');
      
      toast({
        title: "設定をクリア",
        description: "Figma API設定をクリアしました（ローカルのみ）",
      });
    }
  };

  const formatLastTested = (dateString: string | null) => {
    if (!dateString) return "未テスト";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP');
    } catch {
      return "不明";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Figma className="h-5 w-5" />
          Figma API設定
        </CardTitle>
        <CardDescription>
          FigmaのAPIキーを設定してデザインファイルにアクセスします
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <p className="font-medium">
                {isConnected ? 'Figmaに接続済み' : 'Figma未接続'}
              </p>
              <p className="text-sm text-muted-foreground">
                最終テスト: {formatLastTested(lastTested)}
              </p>
            </div>
          </div>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              接続中
            </Badge>
          )}
        </div>

        {/* Figma User Info */}
        {figmaUserInfo && (
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            {figmaUserInfo.img_url && (
              <img 
                src={figmaUserInfo.img_url} 
                alt={figmaUserInfo.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{figmaUserInfo.name}</p>
              <p className="text-sm text-muted-foreground">{figmaUserInfo.email}</p>
            </div>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-3">
          <Label htmlFor="figma-api-key">Figma APIキー</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="figma-api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="figd_..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Figmaの設定から取得できる個人アクセストークンを入力してください
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={testFigmaConnection}
            disabled={isTestingConnection || !apiKey.trim()}
            variant="outline"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTestingConnection ? "テスト中..." : "接続テスト"}
          </Button>
          
          <Button
            onClick={handleSaveApiKey}
            disabled={isSaving || !apiKey.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>

          {(apiKey || isConnected) && (
            <Button
              onClick={handleClearSettings}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              クリア
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">APIキーの取得方法:</p>
            <ol className="text-blue-800 space-y-1 list-decimal list-inside">
              <li>Figmaにログインし、アカウント設定を開く</li>
              <li>「Personal access tokens」セクションを探す</li>
              <li>「New personal access token」をクリック</li>
              <li>適切な名前を付けて「Generate token」をクリック</li>
              <li>生成されたトークンをコピーして上記に貼り付け</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FigmaApiSettings;