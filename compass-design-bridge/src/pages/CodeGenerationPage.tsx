
import React, { useState } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { codeGenerationTemplates } from "@/services/mockData";
import { ModelSelector, LanguageModel } from "@/components/ui/model-selector";

const CodeGenerationPage = () => {
  const [selectedFramework, setSelectedFramework] = useState("react");
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedModel, setSelectedModel] = useState<LanguageModel>({
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
  });

  const handleGenerate = () => {
    setGenerating(true);
    
    // Mock code generation
    toast({
      title: "コード生成中",
      description: `${selectedFramework.toUpperCase()}フレームワーク向けのコード生成を開始しています...`,
    });
    
    setTimeout(() => {
      setGenerating(false);
      toast({
        title: "コード生成完了",
        description: "コードが正常に生成されました。",
      });
    }, 2000);
  };

  const handleModelChange = (model: LanguageModel) => {
    setSelectedModel(model);
    toast({
      title: "モデルを変更しました",
      description: `${model.name}を使用してコード生成します`,
    });
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">コード生成</h1>
        <p className="text-muted-foreground">
          AIを使用してFigmaデザインからコードを生成
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">生成設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModelSelector 
                onModelChange={handleModelChange}
                defaultModelId={selectedModel.id}
              />
              
              <div className="space-y-2">
                <label htmlFor="framework" className="text-sm font-medium">
                  対象フレームワーク
                </label>
                <Select
                  value={selectedFramework}
                  onValueChange={setSelectedFramework}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="フレームワークを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue.js</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                    <SelectItem value="html">HTML/CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="template" className="text-sm font-medium">
                  コードテンプレート
                </label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="テンプレートを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="component">UIコンポーネント</SelectItem>
                    <SelectItem value="page">フルページ</SelectItem>
                    <SelectItem value="layout">レイアウト</SelectItem>
                    <SelectItem value="form">フォーム</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full bg-mcp-primary hover:bg-mcp-tertiary"
                disabled={generating}
              >
                {generating ? "生成中..." : "コード生成"}
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">テンプレート</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {codeGenerationTemplates.map((template) => (
                <div key={template.id} className="rounded-md border p-3 hover:border-mcp-primary cursor-pointer">
                  <div className="font-medium">{template.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.frameworks.map((framework) => (
                      <span
                        key={framework}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        {framework}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">コードプレビュー</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="code" className="w-full">
                <div className="p-4 border-b">
                  <TabsList>
                    <TabsTrigger value="code">生成コード</TabsTrigger>
                    <TabsTrigger value="preview">ライブプレビュー</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="code" className="p-4">
                  {generating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcp-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">コード生成中...</p>
                      </div>
                    </div>
                  ) : (
                    <pre className="code-block h-64 overflow-auto">
                      {`// 生成された${selectedFramework.toUpperCase()}コンポーネント
${selectedFramework === 'react' ? 
`import React from 'react';

const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button
      className={\`px-4 py-2 rounded-md \${
        variant === 'primary'
          ? 'bg-purple-600 text-white'
          : 'bg-gray-200 text-gray-800'
      }\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;`
: selectedFramework === 'vue' ?
`<template>
  <button
    class="px-4 py-2 rounded-md"
    :class="variant === 'primary' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: {
    variant: {
      type: String,
      default: 'primary'
    }
  }
}
</script>`
: `/* フレームワークを選択してコードを生成してください */`}`}
                    </pre>
                  )}
                </TabsContent>
                <TabsContent value="preview" className="p-4">
                  {generating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcp-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">プレビュー生成中...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md p-6 h-64 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <button className="px-4 py-2 rounded-md bg-mcp-primary text-white">
                          ボタン例
                        </button>
                        <p className="mt-4 text-sm text-muted-foreground">
                          生成されたコンポーネントのライブプレビュー
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CodeGenerationPage;
