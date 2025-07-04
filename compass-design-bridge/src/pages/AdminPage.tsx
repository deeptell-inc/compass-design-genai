import React from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import VersionManager from "@/components/admin/VersionManager";
import FigmaSystemSettings from "@/components/admin/FigmaSystemSettings";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Users, Activity, Figma } from "lucide-react";
import { AdminGuard } from '@/components/auth/AdminGuard';

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification, currentVersion } = useNotifications();

  // For demo purposes, consider any authenticated user as admin
  // In production, you'd check for actual admin role
  const isAdmin = isAuthenticated;

  const handleTestNotification = () => {
    addNotification({
      title: "テスト通知",
      message: "これは管理者からのテスト用通知です。システムが正常に動作しています。",
      version: currentVersion,
      priority: "medium",
      type: "info",
    });
  };

  const handleTestVersionNotification = () => {
    addNotification({
      title: "重要なお知らせ",
      message: "新しい機能が追加されました。詳細はリリースノートをご確認ください。",
      version: currentVersion,
      priority: "high",
      type: "success",
    });
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <CardTitle>アクセス制限</CardTitle>
              <CardDescription>
                この機能を使用するにはログインが必要です
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">管理画面</h1>
            <p className="text-muted-foreground">
              システムの設定と通知を管理します
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                現在ログイン中
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティビティ</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                過去24時間
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Figma接続数</CardTitle>
              <Figma className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                アクティブ接続
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">システム状態</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">正常</div>
              <p className="text-xs text-muted-foreground">
                稼働中
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>テスト機能</CardTitle>
            <CardDescription>
              通知システムのテストを行います
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleTestNotification} variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                管理者通知送信
              </Button>
              <Button onClick={handleTestVersionNotification} variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                重要なお知らせ送信
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version Manager */}
        <VersionManager isAdmin={isAdmin} />

        {/* Figma System Settings */}
        <FigmaSystemSettings isAdmin={isAdmin} />

        <AdminGuard>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ユーザー管理</CardTitle>
              </CardHeader>
              <CardContent>
                <Button>ユーザー一覧を表示</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>システム設定</CardTitle>
              </CardHeader>
              <CardContent>
                <Button>設定を変更</Button>
              </CardContent>
            </Card>
          </div>
        </AdminGuard>
      </div>
    </MainLayout>
  );
};

export default AdminPage;