import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Figma,
  Users,
  Key,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface FigmaSystemSettingsProps {
  isAdmin?: boolean;
}

interface FigmaStats {
  totalConnectedUsers: number;
  activeConnections: number;
  failedConnections: number;
  lastSystemCheck: string | null;
}

const FigmaSystemSettings = ({ isAdmin = false }: FigmaSystemSettingsProps) => {
  const [stats, setStats] = useState<FigmaStats>({
    totalConnectedUsers: 0,
    activeConnections: 0,
    failedConnections: 0,
    lastSystemCheck: null,
  });
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);

  // Only show to admin users
  if (!isAdmin) {
    return null;
  }

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = () => {
    // Mock data for demonstration
    // In a real implementation, this would come from your backend
    const mockStats: FigmaStats = {
      totalConnectedUsers: 3,
      activeConnections: 2,
      failedConnections: 1,
      lastSystemCheck: new Date().toISOString(),
    };
    
    setStats(mockStats);
    setSystemHealthy(mockStats.activeConnections > 0);
  };

  const checkSystemHealth = async () => {
    setIsCheckingSystem(true);
    
    try {
      // Simulate system health check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock health check results
      const healthyConnections = Math.floor(Math.random() * 5) + 1;
      const totalUsers = Math.floor(Math.random() * 3) + healthyConnections;
      
      const updatedStats: FigmaStats = {
        totalConnectedUsers: totalUsers,
        activeConnections: healthyConnections,
        failedConnections: totalUsers - healthyConnections,
        lastSystemCheck: new Date().toISOString(),
      };
      
      setStats(updatedStats);
      setSystemHealthy(healthyConnections > 0);
      
      toast({
        title: "システムチェック完了",
        description: `${healthyConnections}個のアクティブなFigma接続を検出しました`,
      });
      
    } catch (error) {
      console.error('System health check failed:', error);
      setSystemHealthy(false);
      
      toast({
        title: "システムチェック失敗",
        description: "システムの健全性チェックに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsCheckingSystem(false);
    }
  };

  const viewUserConnections = () => {
    // This would open a modal or navigate to a detailed view
    toast({
      title: "ユーザー接続情報",
      description: "Figma接続の詳細情報を表示する機能は開発中です",
    });
  };

  const formatLastCheck = (dateString: string | null) => {
    if (!dateString) return "未実行";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP');
    } catch {
      return "不明";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Figma className="h-5 w-5" />
          Figmaシステム設定
        </CardTitle>
        <CardDescription>
          全ユーザーのFigma API接続状態とシステム健全性を管理
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Health Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              systemHealthy === null ? 'bg-gray-400' : 
              systemHealthy ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div>
              <p className="font-medium">
                {systemHealthy === null ? 'システム状態: 未確認' :
                 systemHealthy ? 'システム状態: 正常' : 'システム状態: 問題あり'}
              </p>
              <p className="text-sm text-muted-foreground">
                最終チェック: {formatLastCheck(stats.lastSystemCheck)}
              </p>
            </div>
          </div>
          {systemHealthy !== null && (
            <Badge variant={systemHealthy ? "secondary" : "destructive"} className={
              systemHealthy ? "bg-green-100 text-green-800" : ""
            }>
              {systemHealthy ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  正常
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  問題あり
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">総接続ユーザー</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalConnectedUsers}</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">アクティブ接続</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.activeConnections}</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">失敗した接続</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.failedConnections}</p>
          </div>
        </div>

        {/* Warning if there are failed connections */}
        {stats.failedConnections > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">接続の問題が検出されました</p>
              <p className="text-yellow-800">
                {stats.failedConnections}個のFigma接続が失敗しています。
                ユーザーにAPIキーの確認を促すか、システムチェックを実行してください。
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={checkSystemHealth}
            disabled={isCheckingSystem}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSystem ? 'animate-spin' : ''}`} />
            {isCheckingSystem ? "チェック中..." : "システムチェック"}
          </Button>
          
          <Button
            onClick={viewUserConnections}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            接続詳細を表示
          </Button>

          <Button
            onClick={loadSystemStats}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            統計を更新
          </Button>
        </div>

        {/* System Information */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium">システム情報</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Figma API バージョン:</span>
              <span className="ml-2 font-mono">v1</span>
            </div>
            <div>
              <span className="text-muted-foreground">接続タイムアウト:</span>
              <span className="ml-2 font-mono">30秒</span>
            </div>
            <div>
              <span className="text-muted-foreground">レート制限:</span>
              <span className="ml-2 font-mono">1000 requests/hour</span>
            </div>
            <div>
              <span className="text-muted-foreground">キャッシュ期間:</span>
              <span className="ml-2 font-mono">15分</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FigmaSystemSettings;