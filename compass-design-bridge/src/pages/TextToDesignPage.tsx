import React from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import TextToDesign from "@/components/dashboard/TextToDesign";

const TextToDesignPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Text to Design</h1>
          <p className="text-muted-foreground">
            テキストの説明からAIがデザインを自動生成します
          </p>
        </div>
        
        <TextToDesign />
      </div>
    </MainLayout>
  );
};

export default TextToDesignPage;
