
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

interface FigmaIntegrationCardProps {
  connected: boolean;
  onConnect: () => void;
  onFetchDesign: (fileUrl: string) => void;
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

const FigmaIntegrationCard = ({
  connected,
  onConnect,
  onFetchDesign,
}: FigmaIntegrationCardProps) => {
  const [fileUrl, setFileUrl] = useState("");
  const [figmaSettings, setFigmaSettings] = useState<FigmaSettings | null>(null);
  const [isApiConnected, setIsApiConnected] = useState(false);

  // Load Figma settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('figmaSettings');
    if (savedSettings) {
      try {
        const settings: FigmaSettings = JSON.parse(savedSettings);
        setFigmaSettings(settings);
        setIsApiConnected(settings.isConnected && !!settings.apiKey);
      } catch (error) {
        console.error('Failed to parse Figma settings:', error);
      }
    }
  }, []);

  const handleFetchDesign = (e: React.FormEvent) => {
    e.preventDefault();
    onFetchDesign(fileUrl);
  };

  const handleOpenSettings = () => {
    // This would open the user profile settings with Figma tab selected
    // For now, we'll just show a message
    alert("プロフィール設定のFigma APIタブでAPIキーを設定してください");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Figma連携
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSettings}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>API接続状態</span>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center ${
                isApiConnected ? "text-green-500" : "text-amber-500"
              }`}
            >
              <div
                className={`mr-2 h-2 w-2 rounded-full ${
                  isApiConnected ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              <span>{isApiConnected ? "接続済み" : "未接続"}</span>
            </div>
          </div>
        </div>

        {/* Figma User Info */}
        {isApiConnected && figmaSettings?.userInfo && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {figmaSettings.userInfo.img_url && (
              <img 
                src={figmaSettings.userInfo.img_url} 
                alt={figmaSettings.userInfo.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium">{figmaSettings.userInfo.name}</p>
              <p className="text-xs text-muted-foreground">{figmaSettings.userInfo.email}</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 ml-auto">
              認証済み
            </Badge>
          </div>
        )}

        {!isApiConnected ? (
          <div className="space-y-3">
            <Button onClick={handleOpenSettings} className="w-full bg-mcp-primary hover:bg-mcp-tertiary">
              Figma APIキーを設定する
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              プロフィール設定でFigma APIキーを設定してください
            </p>
          </div>
        ) : (
          <form onSubmit={handleFetchDesign} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="figma-url" className="text-sm font-medium">
                FigmaファイルURLまたはID
              </label>
              <Input
                id="figma-url"
                placeholder="https://www.figma.com/file/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-mcp-primary hover:bg-mcp-tertiary">
              デザインを取得
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default FigmaIntegrationCard;
