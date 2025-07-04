import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";
import {
  Settings,
  Plus,
  Upload,
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface VersionManagerProps {
  isAdmin?: boolean;
}

const VersionManager = ({ isAdmin = false }: VersionManagerProps) => {
  const {
    currentVersion,
    setCurrentVersion,
    addNotification,
    notifications,
    clearAllNotifications,
  } = useNotifications();

  const [newVersion, setNewVersion] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationPriority, setNotificationPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Only show to admin users
  if (!isAdmin) {
    return null;
  }

  const handleVersionUpdate = () => {
    if (!newVersion.trim()) {
      toast({
        title: "エラー",
        description: "バージョン番号を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (newVersion === currentVersion) {
      toast({
        title: "エラー",
        description: "現在のバージョンと同じです",
        variant: "destructive",
      });
      return;
    }

    setCurrentVersion(newVersion);
    setNewVersion("");

    toast({
      title: "成功",
      description: `バージョンを ${newVersion} に更新しました`,
    });
  };

  const handleAddNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: "エラー",
        description: "タイトルとメッセージを入力してください",
        variant: "destructive",
      });
      return;
    }

    addNotification({
      title: notificationTitle,
      message: notificationMessage,
      version: currentVersion,
      priority: notificationPriority,
      type: notificationType,
    });

    // Reset form
    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationPriority('medium');
    setNotificationType('info');
    setIsDialogOpen(false);

    toast({
      title: "成功",
      description: "通知を追加しました",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          サイト管理 - バージョン & 通知管理
        </CardTitle>
        <CardDescription>
          サイトのバージョン情報と通知を管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Version Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">バージョン管理</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>現在のバージョン:</Label>
              <Badge variant="outline" className="text-sm">
                v{currentVersion}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="新しいバージョン (例: 1.1.0)"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleVersionUpdate}>
              <Upload className="h-4 w-4 mr-2" />
              バージョン更新
            </Button>
          </div>
        </div>

        {/* Notification Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">通知管理</h3>
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    通知追加
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>新しい通知を追加</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">タイトル</Label>
                      <Input
                        id="title"
                        placeholder="通知のタイトル"
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">メッセージ</Label>
                      <Textarea
                        id="message"
                        placeholder="通知の内容"
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>優先度</Label>
                        <Select
                          value={notificationPriority}
                          onValueChange={(value: 'low' | 'medium' | 'high') =>
                            setNotificationPriority(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>タイプ</Label>
                        <Select
                          value={notificationType}
                          onValueChange={(value: 'info' | 'warning' | 'error' | 'success') =>
                            setNotificationType(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">情報</SelectItem>
                            <SelectItem value="success">成功</SelectItem>
                            <SelectItem value="warning">警告</SelectItem>
                            <SelectItem value="error">エラー</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAddNotification} className="w-full">
                      <Bell className="h-4 w-4 mr-2" />
                      通知を追加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={clearAllNotifications}
                className="text-red-500 hover:text-red-700"
              >
                全通知削除
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                通知はありません
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(notification.type)}
                    <div>
                      <h4 className="text-sm font-medium">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      v{notification.version}
                    </Badge>
                    <Badge
                      variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {notification.priority === 'high'
                        ? '高'
                        : notification.priority === 'medium'
                        ? '中'
                        : '低'}
                    </Badge>
                    {notification.isRead ? (
                      <Badge variant="outline" className="text-xs text-green-600">
                        既読
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        未読
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionManager;