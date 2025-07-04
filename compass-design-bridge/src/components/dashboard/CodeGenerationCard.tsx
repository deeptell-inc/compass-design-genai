
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModelSelector, LanguageModel } from "@/components/ui/model-selector";

interface CodeGenerationCardProps {
  title: string;
  description: string;
  codePreviewSrc?: string;
  frameworks: string[];
  onGenerate: () => void;
}

const CodeGenerationCard = ({
  title,
  description,
  codePreviewSrc,
  frameworks,
  onGenerate,
}: CodeGenerationCardProps) => {
  const [selectedModel, setSelectedModel] = useState<LanguageModel>({
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        {codePreviewSrc ? (
          <div className="relative h-32 w-full overflow-hidden">
            <img
              src={codePreviewSrc}
              alt="コードプレビュー"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex flex-wrap gap-2">
                {frameworks.map((framework) => (
                  <span
                    key={framework}
                    className="rounded-md bg-black/30 px-2 py-0.5 text-xs text-white"
                  >
                    {framework}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center bg-gray-100 dark:bg-gray-800">
            <p className="text-sm text-muted-foreground">プレビューなし</p>
          </div>
        )}

        <div className="p-4 space-y-4">
          <ModelSelector 
            onModelChange={setSelectedModel} 
            defaultModelId="claude-3.5-sonnet" 
          />
          
          <Button onClick={onGenerate} className="w-full bg-mcp-primary hover:bg-mcp-tertiary">
            コード生成
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeGenerationCard;
