
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-mcp-primary text-primary-foreground">AI</AvatarFallback>
          <AvatarImage src="/placeholder.svg" />
        </Avatar>
      )}

      <div
        className={cn(
          "relative rounded-lg px-4 py-3 max-w-[80%]",
          isUser
            ? "bg-mcp-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span className="absolute bottom-1 right-2 text-[10px] opacity-50">
          {new Date(message.timestamp).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-muted-foreground text-primary-foreground">ユーザー</AvatarFallback>
          <AvatarImage src="/placeholder.svg" />
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
