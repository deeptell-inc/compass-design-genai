
import React, { useState } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import BrainstormChat from "@/components/brainstorm/BrainstormChat";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelSelector, LanguageModel } from "@/components/ui/model-selector";

const BrainstormPage = () => {
  const [selectedModel, setSelectedModel] = useState<LanguageModel>({
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
  });

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">デザインアイデアブレストーミング</h1>
        <p className="text-muted-foreground">
          AIとの対話を通じてデザインアイデアを発展させ、創造的な解決策を探求する
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-[calc(100vh-220px)]">
        <div className="lg:col-span-2 h-full">
          <BrainstormChat />
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">アイデア記録と参照</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="saved" className="w-full h-full">
                <div className="p-4 border-b">
                  <TabsList>
                    <TabsTrigger value="saved">保存済み</TabsTrigger>
                    <TabsTrigger value="history">履歴</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="saved" className="p-4 h-[calc(100%-60px)] overflow-y-auto">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      気に入ったアイデアを保存すると、ここに表示されます。
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="history" className="p-4 h-[calc(100%-60px)] overflow-y-auto">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      過去の会話履歴がここに表示されます。
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default BrainstormPage;
