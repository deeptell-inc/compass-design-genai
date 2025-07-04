import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Bell, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  User,
  LogOut,
  UserPlus,
  LogIn,
  Shield
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import BasicAuth from "@/components/auth/BasicAuth";
import UserProfileSettings from "@/components/auth/UserProfileSettings";
import NotificationPanel from "@/components/notifications/NotificationPanel";

interface DashboardHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
}

const DashboardHeader = ({ setSidebarOpen, sidebarOpen }: DashboardHeaderProps) => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(!isAuthenticated);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const handleLogout = () => {
    logout();
    setShowAuth(true);
  };

  const handleAuthenticated = () => {
    setShowAuth(false);
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-xl font-medium">Start Link</h1>
          {isAdmin && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs">
              <Shield className="h-3 w-3" />
              管理者
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <NotificationPanel>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </NotificationPanel>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowProfileSettings(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.email} />
                    <AvatarFallback className="bg-mcp-primary text-white">
                      {user?.email ? getUserInitials(user.email) : 'US'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">ユーザー</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                  <User className="mr-2 h-4 w-4" />
                  プロフィール
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-500 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">ゲストユーザー</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      ログインが必要です
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowAuth(true)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  ログイン
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAuth(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  新規登録
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {showAuth && !isAuthenticated && (
        <BasicAuth onAuthenticated={handleAuthenticated} />
      )}

      {showProfileSettings && (
        <UserProfileSettings 
          open={showProfileSettings} 
          onClose={() => setShowProfileSettings(false)} 
        />
      )}
    </>
  );
};

export default DashboardHeader;
