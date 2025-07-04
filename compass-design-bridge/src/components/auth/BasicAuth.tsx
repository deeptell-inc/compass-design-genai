import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Lock, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

interface BasicAuthProps {
  onAuthenticated: () => void;
}

const BasicAuth = ({ onAuthenticated }: BasicAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated) {
      onAuthenticated();
      setOpen(false);
    }
  }, [isAuthenticated, onAuthenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 一時的にデモエンドポイントを使用
      const endpoint = '/auth/demo';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('Auth response:', result); // デバッグ用

      if (result.success) {
        login(result.data.token, result.data.user);
        onAuthenticated();
        setOpen(false);
        toast({
          title: "ログイン成功",
          description: "COMPASS Design GenAIへようこそ！",
        });
      } else {
        toast({
          title: "認証エラー",
          description: result.error || "認証に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auth error:', error); // デバッグ用
      toast({
        title: "エラー",
        description: "サーバーとの通信に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 認証済みの場合は何も表示しない
  if (isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRegister ? <UserPlus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            {isRegister ? "アカウント作成" : "ログイン"}
          </DialogTitle>
          <DialogDescription>
            {isRegister 
              ? "新しいアカウントを作成してCOMPASS Design GenAIを利用開始しましょう。" 
              : "メールアドレスとパスワードを入力してログインしてください。"
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "処理中..." : (isRegister ? "アカウント作成" : "ログイン")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "既にアカウントをお持ちですか？ ログイン" : "アカウントをお持ちでない方はこちら"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BasicAuth;
