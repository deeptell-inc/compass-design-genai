
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FigmaPage from "./pages/FigmaPage";
import FigmaMCPPage from "./pages/FigmaMCPPage";
import CodeGenerationPage from "./pages/CodeGenerationPage";
import CodeGenerationEnhancedPage from "./pages/CodeGenerationEnhancedPage";
import BrainstormPage from "./pages/BrainstormPage";
import BrainstormingPage from "./pages/BrainstormingPage";
import BusinessStrategyPage from "./pages/BusinessStrategyPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ABTestingPage from "./pages/ABTestingPage";
import ResearchPage from "./pages/ResearchPage";
import BusinessInsightsPage from "./pages/BusinessInsightsPage";
import TextToDesignPage from "./pages/TextToDesignPage";
import StrategicDesignPage from "./pages/StrategicDesignPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import BasicAuth from "./components/auth/BasicAuth";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { NotificationProvider } from "./hooks/useNotifications";
import { AnalyticsProvider } from "./hooks/useAnalytics";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/figma" element={<FigmaPage />} />
          <Route path="/figma-mcp" element={<FigmaMCPPage />} />
          <Route path="/code-generation" element={<CodeGenerationPage />} />
          <Route path="/code-generation-enhanced" element={<CodeGenerationEnhancedPage />} />
          <Route path="/brainstorm" element={<BrainstormPage />} />
          <Route path="/brainstorming" element={<BrainstormingPage />} />
          <Route path="/business-strategy" element={<BusinessStrategyPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/ab-testing" element={<ABTestingPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/business-insights" element={<BusinessInsightsPage />} />
          <Route path="/text-to-design" element={<TextToDesignPage />} />
          <Route path="/strategic-design" element={<StrategicDesignPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AnalyticsProvider>
            <TooltipProvider>
              <AppContent />
            </TooltipProvider>
          </AnalyticsProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
