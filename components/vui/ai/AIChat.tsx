
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatProps {
  apiKey: string;
  model?: string;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  systemPrompt?: string;
  onMessageSent?: (message: string) => void;
  onResponseReceived?: (response: string) => void;
  onError?: (error: string) => void;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

// Glass panel styles
const glassPanel = "bg-background/70 dark:bg-background/60 backdrop-blur-xl backdrop-saturate-150 border border-border/50 shadow-lg";
const motionSafe = "motion-safe:transition-all motion-safe:duration-300 motion-reduce:transition-none";

// Main AIChat Component
export const AIChat: React.FC<AIChatProps> = ({
  apiKey,
  model = 'gpt-3.5-turbo',
  placeholder = "Ask me anything...",
  className,
  maxHeight = "600px",
  systemPrompt = "You are a helpful AI assistant.",
  onMessageSent,
  onResponseReceived,
  onError
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  // OpenAI API call
  const callOpenAI = async (messages: Message[]): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(msg => ({ role: msg.role, content: msg.content }))
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    onMessageSent?.(userMessage.content);

    try {
      const response = await callOpenAI(newMessages);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      onResponseReceived?.(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn(
      "flex flex-col w-full rounded-2xl overflow-hidden",
      glassPanel,
      className
    )} style={{ maxHeight }}>
      
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Bot className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">Powered by {model}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Start a conversation...</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl border border-border/50 px-4 py-3",
              "bg-background/50 backdrop-blur-sm",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "max-h-32 overflow-y-auto",
              motionSafe
            )}
            style={{ minHeight: '48px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 focus:ring-2 focus:ring-primary/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200",
              motionSafe
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-muted text-foreground rounded-tl-sm"
      )}>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className={cn(
          "text-xs mt-2 opacity-70",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => (
  <div className="flex gap-3">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
      <Bot className="w-4 h-4" />
    </div>
    <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  </div>
);

// Utility hook for managing chat state
export const useAIChat = (apiKey: string, model?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearChat = () => setMessages([]);
  
  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  return {
    messages,
    isLoading,
    clearChat,
    addMessage,
    setIsLoading,
  };
};

export default AIChat;