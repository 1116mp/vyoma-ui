// AIChatShowcase.tsx
"use client";

import React, { useState } from 'react';
import { AIChat } from './AIChat';
import { Button } from '@/components/ui/buttonShadcn';
import { Eye, Code, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const glassPanel = "bg-background/70 dark:bg-background/60 backdrop-blur-xl backdrop-saturate-150 border border-border/50 shadow-lg";

export default function AIChatShowcase() {
  const [apiKey, setApiKey] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const code = `import { AIChat } from '@/components/vui/ai/AIChat';

export default function MyChat() {
  return (
    <AIChat
      apiKey="your-openai-api-key"
      model="gpt-3.5-turbo"
      placeholder="Ask me anything..."
      maxHeight="600px"
      systemPrompt="You are a helpful AI assistant."
      onMessageSent={(message) => console.log('Sent:', message)}
      onResponseReceived={(response) => console.log('Received:', response)}
      onError={(error) => console.error('Error:', error)}
      className="max-w-2xl mx-auto"
    />
  );
}`;
    
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          AI Chat Component
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A ready-to-use AI chat component with OpenAI integration. Just add your API key and start chatting!
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          variant={showCode ? "outline" : "default"}
          onClick={() => setShowCode(false)}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Preview
        </Button>
        <Button
          variant={showCode ? "default" : "outline"}
          onClick={() => setShowCode(true)}
          className="flex items-center gap-2"
        >
          <Code className="w-4 h-4" />
          Code
        </Button>
      </div>

      {/* Content */}
      {!showCode ? (
        <div className="space-y-6">
          {/* API Key Input */}
          {!apiKey && (
            <div className={cn("max-w-md mx-auto p-6 rounded-2xl", glassPanel)}>
              <h3 className="text-lg font-semibold mb-4">Enter OpenAI API Key</h3>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="sk-..."
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is only used locally and never stored.
                </p>
              </div>
            </div>
          )}

          {/* Chat Component */}
          {apiKey && (
            <div className="max-w-2xl mx-auto">
              <AIChat
                apiKey={apiKey}
                model="gpt-3.5-turbo"
                placeholder="Ask me anything... ✨"
                maxHeight="500px"
                systemPrompt="You are a helpful AI assistant. Be concise and friendly."
                onMessageSent={(message) => console.log('Message sent:', message)}
                onResponseReceived={(response) => console.log('Response received:', response)}
                onError={(error) => console.error('Chat error:', error)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={cn("relative p-6 rounded-2xl", glassPanel)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Usage Example</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <pre className="text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto">
            <code>{`import { AIChat } from '@/components/vui/ai/AIChat';

export default function MyChat() {
  return (
    <AIChat
      apiKey="your-openai-api-key"
      model="gpt-3.5-turbo"
      placeholder="Ask me anything..."
      maxHeight="600px"
      systemPrompt="You are a helpful AI assistant."
      onMessageSent={(message) => console.log('Sent:', message)}
      onResponseReceived={(response) => console.log('Received:', response)}
      onError={(error) => console.error('Error:', error)}
      className="max-w-2xl mx-auto"
    />
  );
}`}</code>
          </pre>
        </div>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {[
          { title: "OpenAI Integration", desc: "Direct integration with OpenAI's API" },
          { title: "Real-time Chat", desc: "Smooth typing indicators and message flow" },
          { title: "Error Handling", desc: "Graceful error states and recovery" },
          { title: "Customizable", desc: "Multiple props for styling and behavior" },
          { title: "TypeScript", desc: "Fully typed for better developer experience" },
          { title: "Responsive", desc: "Works perfectly on mobile and desktop" }
        ].map((feature, i) => (
          <div key={i} className={cn("p-4 rounded-xl", glassPanel)}>
            <h4 className="font-semibold mb-2">{feature.title}</h4>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}