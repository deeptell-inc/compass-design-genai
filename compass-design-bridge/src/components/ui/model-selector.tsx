
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type LanguageModel = {
  id: string;
  name: string;
  description?: string;
  provider: "anthropic" | "openai" | "perplexity" | "gemini" | "other";
};

const defaultModels: LanguageModel[] = [
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "最新のAnthropicモデル。高度な推論と創造的タスクに最適。",
    provider: "anthropic",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAIの最新モデル。マルチモーダル機能を備えた高度な理解力。",
    provider: "openai",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Googleのマルチモーダル言語モデル。",
    provider: "gemini",
  },
  {
    id: "perplexity-online",
    name: "Perplexity",
    description: "最新のウェブ検索機能を備えたモデル。",
    provider: "perplexity",
  },
];

interface ModelSelectorProps {
  models?: LanguageModel[];
  defaultModelId?: string;
  onModelChange?: (model: LanguageModel) => void;
}

export function ModelSelector({
  models = defaultModels,
  defaultModelId = "claude-3.5-sonnet",
  onModelChange,
}: ModelSelectorProps) {
  const [selectedModelId, setSelectedModelId] = React.useState(defaultModelId);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const selectedModel = models.find((m) => m.id === modelId);
    if (selectedModel && onModelChange) {
      onModelChange(selectedModel);
    }
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="model-selector" className="text-sm font-medium">
        言語モデル
      </label>
      <Select value={selectedModelId} onValueChange={handleModelChange}>
        <SelectTrigger id="model-selector">
          <SelectValue placeholder="モデルを選択" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span>{model.name}</span>
                {model.description && (
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
