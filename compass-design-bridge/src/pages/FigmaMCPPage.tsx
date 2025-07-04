import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

// Type definitions
type FigmaKeyRequest = { key: string };
type TokenResponse = { token: string; expiresAt: string };

const FigmaMCPPage = () => {
  const [figmaKey, setFigmaKey] = useState("");
  const [figmaKeySaved, setFigmaKeySaved] = useState(false);
  const [jwtToken, setJwtToken] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null') {
      setJwtToken(token);
      
      // Try to decode token to get expiry (this is just for display)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          setTokenExpiry(new Date(payload.exp * 1000).toISOString());
        }
      } catch (error) {
        // If token parsing fails, set a default expiry
        setTokenExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      }
    } else {
      // Generate a demo token for testing if none exists
      generateDemoToken();
    }
  }, []);

  // Generate demo token for testing
  const generateDemoToken = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@example.com' })
      });

      const data = await response.json();
      if (data.success && data.data.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userEmail', 'demo@example.com');
        setJwtToken(data.data.token);
        setTokenExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      }
    } catch (error) {
      console.error('Failed to generate demo token:', error);
    }
  };

  // Generate dynamic code snippet
  const generateConfigSnippet = (apiKey: string) => {
    return `{
  "mcpServers": {
    "figma-developer-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "figma-developer-mcp",
        "--stdio"
      ],
      "env": {
        "FIGMA_API_KEY": "${apiKey || 'YOUR_FIGMA_API_KEY'}"
      }
    }
  }
}`;
  };

  const configSnippet = generateConfigSnippet(figmaKey);

  // Clipboard functionality
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: successMessage,
      });
    } catch (err) {
      toast({
        title: "コピーに失敗しました",
        description: "クリップボードへのアクセスができませんでした。",
        variant: "destructive",
      });
    }
  };

  // Figma API Key validation
  const validateFigmaKey = (key: string): boolean => {
    return key.trim().length >= 40 && key.trim().length <= 64 && /^[a-zA-Z0-9-_]+$/.test(key.trim());
  };

  // Save Figma API Key
  const handleSave = async () => {
    if (!figmaKey.trim()) {
      toast({
        title: "API キーが必要です",
        description: "Figma API キーを入力してください。",
        variant: "destructive",
      });
      return;
    }

    if (!validateFigmaKey(figmaKey)) {
      toast({
        title: "無効な API キー",
        description: "正しい形式の Figma API キーを入力してください（40-64文字の英数字）。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3002/api/figmaKey', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: figmaKey.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }
      
      setFigmaKeySaved(true);
      toast({
        title: "API キーが保存されました",
        description: "Figma API キーが正常に保存されました。",
      });
    } catch (error) {
      toast({
        title: "保存に失敗しました",
        description: error instanceof Error ? error.message : "API キーの保存中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh JWT Token
  const handleRefreshToken = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3002/api/token/refresh', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh token');
      }

      const { token: newToken, expiresAt }: TokenResponse = result.data;
      
      // Update local storage with new token
      localStorage.setItem('authToken', newToken);
      
      setJwtToken(newToken);
      setTokenExpiry(expiresAt);
      
      toast({
        title: "トークンが更新されました",
        description: "JWT トークンが正常に更新されました。",
      });
    } catch (error) {
      toast({
        title: "更新に失敗しました",
        description: error instanceof Error ? error.message : "トークンの更新中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout functionality
  const handleLogout = () => {
    // Clear local storage / cookies
    localStorage.clear();
    // Redirect to login page
    window.location.href = '/login';
  };

  // Format expiry date
  const formatExpiryDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('ja-JP');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Section A: Figma API Settings */}
        <Card className="p-8">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-xl">Figma API 設定</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="figma-key">Figma API キー</Label>
              <Input
                id="figma-key"
                type="password"
                placeholder="Figma APIキーを入力してください"
                value={figmaKey}
                onChange={(e) => setFigmaKey(e.target.value)}
                disabled={figmaKeySaved || isLoading}
                aria-label="Figma API Key"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4" />
              <a
                href="https://www.figma.com/developers/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Figma 開発者設定
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSave}
                disabled={isLoading || figmaKeySaved}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
              >
                {isLoading ? "保存中..." : "API キーを保存"}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="w-full bg-gray-600 text-white hover:bg-gray-700"
              >
                ログアウト
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Claude Desktop Settings */}
        <Card className="p-8">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-xl">Claude Desktop 設定</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jwt-token">あなたの JWT トークン:</Label>
              <div className="flex gap-2">
                <Input
                  id="jwt-token"
                  value={jwtToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(jwtToken, "JWT トークンがコピーされました")}
                  className="shrink-0 border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleRefreshToken}
              disabled={isLoading}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "更新中..." : "更新"}
            </Button>

            <p className="text-sm text-muted-foreground">
              トークンの有効期限: {formatExpiryDate(tokenExpiry)}
            </p>

            <div className="relative">
              <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono overflow-auto max-h-60 text-gray-800">
                <code>{configSnippet}</code>
              </pre>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(configSnippet, "設定がコピーされました")}
                className="absolute top-2 right-2 border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Copy className="mr-1 h-3 w-3" />
                設定をコピー
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>重要:</strong> この設定をClaude Desktopの設定ファイルに追加してください。
                パスの変更は不要です。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FigmaMCPPage;