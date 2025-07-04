import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import FigmaApiSettings from "@/components/settings/FigmaApiSettings";
import { 
  User, 
  Mail, 
  Key, 
  Bell, 
  Shield,
  Camera,
  Save,
  Trash2,
  Upload,
  Figma
} from "lucide-react";

interface UserProfileSettingsProps {
  open: boolean;
  onClose: () => void;
}

const UserProfileSettings = ({ open, onClose }: UserProfileSettingsProps) => {
  const { user, logout, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state from user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setShowNotificationBadge(user.settings?.showNotificationBadge ?? true);
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "エラー",
          description: "ファイルサイズは5MB以下である必要があります",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "エラー",
          description: "画像ファイルを選択してください",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "エラー",
        description: "新しいパスワードが一致しません",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "エラー",
        description: "パスワードは6文字以上で入力してください",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement password change API call
    toast({
      title: "成功",
      description: "パスワードが変更されました",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleProfileSave = async () => {
    try {
      let avatarUrl = user?.avatarUrl;
      
      // If new avatar file is selected, convert to base64 and store
      if (avatarFile) {
        avatarUrl = avatarPreview;
      }

      // Update user data
      updateUser({
        displayName,
        avatarUrl,
        settings: {
          showNotificationBadge,
        },
      });

      toast({
        title: "成功",
        description: "プロフィールが保存されました",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "プロフィールの保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("アカウントを削除してもよろしいですか？この操作は取り消せません。")) {
      // TODO: Implement account deletion API call
      logout();
      toast({
        title: "アカウント削除",
        description: "アカウントが削除されました",
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            ユーザー設定
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="security">セキュリティ</TabsTrigger>
            <TabsTrigger value="figma">Figma API</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
            <TabsTrigger value="account">アカウント</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  プロフィール情報
                </CardTitle>
                <CardDescription>
                  あなたのプロフィール情報を管理します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarPreview || user?.avatarUrl || ""} alt={user?.email} />
                    <AvatarFallback className="bg-mcp-primary text-white text-lg">
                      {user?.email ? getUserInitials(user.email) : 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" onClick={handleAvatarButtonClick}>
                      <Camera className="h-4 w-4 mr-2" />
                      写真を変更
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    {avatarFile && (
                      <p className="text-xs text-muted-foreground">
                        選択された画像: {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">表示名</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="表示名を入力"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave}>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  セキュリティ設定
                </CardTitle>
                <CardDescription>
                  パスワードとセキュリティ設定を管理します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">現在のパスワード</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="現在のパスワードを入力"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新しいパスワード</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="新しいパスワードを入力"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">パスワード確認</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="新しいパスワードを再入力"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Key className="h-4 w-4 mr-2" />
                      パスワード変更
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="figma" className="space-y-4">
            <FigmaApiSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  通知設定
                </CardTitle>
                <CardDescription>
                  通知バッジの表示設定を管理します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">通知バッジ表示</h4>
                    <p className="text-sm text-muted-foreground">
                      ヘッダーの通知ベルに未読件数バッジを表示する
                    </p>
                  </div>
                  <Button
                    variant={showNotificationBadge ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowNotificationBadge(!showNotificationBadge)}
                  >
                    {showNotificationBadge ? "ON" : "OFF"}
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>注意:</strong> この設定をオフにすると、ヘッダーの通知ベルに数字バッジが表示されなくなります。
                    通知自体は引き続き受信できますが、未読件数の確認はベルをクリックして行う必要があります。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  アカウント情報
                </CardTitle>
                <CardDescription>
                  アカウントの基本情報と設定
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">アカウント状態</h4>
                    <p className="text-sm text-muted-foreground">アクティブ</p>
                  </div>
                  <Badge variant="secondary">有効</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">メールアドレス</h4>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <Badge variant="outline">確認済み</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileSettings;