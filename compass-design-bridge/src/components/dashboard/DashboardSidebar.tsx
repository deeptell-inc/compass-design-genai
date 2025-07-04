import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Code, Home, Lightbulb, Figma, BarChart3, TestTube, Search, TrendingUp, Wand2, Target } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { useAuth } from '@/hooks/useAuth';

const DashboardSidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="text-xl font-bold">Compass</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarGroupLabel>メインメニュー</SidebarGroupLabel>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <Home size={20} />
                <span>ダッシュボード</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/figma"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <Figma size={20} />
                <span>Figma連携</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/brainstorm"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <Lightbulb size={20} />
                <span>ブレストーミング</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarGroupLabel>Version ＞ 2.0.0</SidebarGroupLabel>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <BarChart3 size={20} />
                <span>高度な分析</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/ab-testing"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <TestTube size={20} />
                <span>A/Bテスト</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/research"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <Search size={20} />
                <span>Deep Research</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/business-insights"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <TrendingUp size={20} />
                <span>ビジネスインサイト</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/text-to-design"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <Wand2 size={20} />
                <span>Text to Design</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/strategic-design"
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                    "bg-accent": isActive
                  })
                }
              >
                <Target size={20} />
                <span>戦略的デザイン策定</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* 管理者のみ表示 */}
          {isAdmin && (
            <div className="admin-section">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                管理機能
              </div>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                        "bg-accent": isActive
                      })
                    }
                  >
                    <Target size={20} />
                    <span>管理画面</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                      cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                        "bg-accent": isActive
                      })
                    }
                  >
                    <Target size={20} />
                    <span>ユーザー管理</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/admin/settings"
                    className={({ isActive }) =>
                      cn("flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent", {
                        "bg-accent": isActive
                      })
                    }
                  >
                    <Target size={20} />
                    <span>システム設定</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">
          <p>Start Link</p>
          <p>Version 1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
