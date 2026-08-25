'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  X, 
  Bot, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Database, 
  Play, 
  Copy, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown,
  ExternalLink,
  Code2,
  Wand2,
  Brain,
  History
} from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import Link from 'next/link';

interface AgentStepTrace {
  step: number;
  thought: string;
  action: string;
  actionInput?: Record<string, any>;
  observation?: string;
  status: 'running' | 'success' | 'error';
}

interface AgenticResponse {
  success: boolean;
  message: string;
  dashboardId?: number;
  dashboardName?: string;
  createdDatasets: { id: number; name: string }[];
  createdWidgets: { id: number; name: string; type: string; chartType?: string }[];
  updatedWidgets: { id: number; name: string }[];
  thoughtTrace: AgentStepTrace[];
  iterations: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  generatedSql?: string;
  suggestedChartType?: string;
  suggestedConfig?: Record<string, any>;
  insights?: string[];
  agentResult?: AgenticResponse;
  timestamp: Date;
}

interface AICopilotProps {
  onClose: () => void;
  dashboardId?: number;
  activeDatasetId?: number;
  activeChartType?: string;
  widgetContext?: {
    id: number;
    name: string;
    type: string;
    config: any;
  };
}

export default function AICopilot({
  onClose,
  dashboardId,
  activeDatasetId,
  activeChartType,
  widgetContext,
}: AICopilotProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'agent' | 'copilot'>('agent');
  const [prompt, setPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: dashboardId
        ? `I am your Autonomous BI Agent. I am connected to Dashboard #${dashboardId}. You can ask me to create complete dashboards, add new charts, modify existing widgets, or write SQL queries.`
        : `I am your Autonomous BI Agent. Give me any data analysis goal (e.g. "Build a Viral Load Suppression Dashboard") and I will introspect tables, write queries, create datasets, and build the charts automatically.`,
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied', description: 'SQL query copied to clipboard.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Run Autonomous Agent Mutation
  const agentMutation = useMutation({
    mutationFn: async (goal: string) => {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          dashboardId,
          conversationHistory: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to run agent.');
      }

      return response.json() as Promise<AgenticResponse>;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          agentResult: data,
          timestamp: new Date(),
        },
      ]);
      setPrompt('');
    },
    onError: (err: any) => {
      toast({
        title: 'Agent Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // 2. Run Standard Copilot Mutation
  const copilotMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: messages.slice(-4).map(m => ({ role: m.role, content: m.content })),
          datasetId: activeDatasetId,
          chartType: activeChartType,
          widgetContext,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to run copilot.');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          generatedSql: data.generatedSql,
          suggestedChartType: data.suggestedChartType,
          suggestedConfig: data.suggestedConfig,
          insights: data.insights,
          timestamp: new Date(),
        },
      ]);
      setPrompt('');
    },
    onError: (err: any) => {
      toast({
        title: 'Copilot Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || agentMutation.isPending || copilotMutation.isPending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (activeTab === 'agent') {
      agentMutation.mutate(prompt);
    } else {
      copilotMutation.mutate(prompt);
    }
  };

  const isLoading = agentMutation.isPending || copilotMutation.isPending;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-background border-l shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <span>BeakDash AI Studio</span>
              <Badge variant="secondary" className="text-[10px] font-mono bg-primary/10 text-primary">
                Agentic Loop
              </Badge>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {dashboardId ? `Target: Dashboard #${dashboardId}` : 'Multi-step reasoning & auto-build'}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2 border-b bg-muted/10">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="agent" className="text-xs gap-1.5">
              <Wand2 className="h-3 w-3" />
              <span>Autonomous Agent</span>
            </TabsTrigger>
            <TabsTrigger value="copilot" className="text-xs gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span>SQL Copilot</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted/40 border text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {/* Agentic Reasoning Trace Accordion */}
              {msg.agentResult?.thoughtTrace && msg.agentResult.thoughtTrace.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3 text-primary" />
                      Thought & Reasoning Trace ({msg.agentResult.thoughtTrace.length} steps)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {msg.agentResult.thoughtTrace.map((step) => (
                      <div key={step.step} className="border rounded-md bg-background/60 p-2 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary uppercase font-mono text-[10px]">
                            Step {step.step}: {step.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{step.status}</span>
                        </div>
                        <p className="text-muted-foreground italic text-[10.5px]">"{step.thought}"</p>
                        {step.observation && (
                          <div className="text-[10px] bg-muted/60 p-1 rounded font-mono text-muted-foreground line-clamp-2">
                            Observation: {step.observation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Created Artifact Badges */}
                  {msg.agentResult.dashboardId && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-emerald-600">
                        ✨ Dashboard Built Successfully
                      </span>
                      <Button asChild size="sm" variant="outline" className="h-6 text-[10px] gap-1">
                        <Link href={`/dashboard/${msg.agentResult.dashboardId}`}>
                          <span>View Dashboard #{msg.agentResult.dashboardId}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Generated SQL snippet */}
              {msg.generatedSql && (
                <div className="rounded-lg bg-background p-2.5 border space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Code2 className="h-3 w-3" />
                      Generated SQL
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5 gap-1"
                      onClick={() => copyToClipboard(msg.generatedSql!, msg.id)}
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-2.5 w-2.5" />
                      )}
                      <span>Copy</span>
                    </Button>
                  </div>
                  <pre className="text-[10.5px] font-mono overflow-x-auto text-primary whitespace-pre-wrap">
                    {msg.generatedSql}
                  </pre>
                </div>
              )}

              {/* Insights */}
              {msg.insights && msg.insights.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1 pt-1">
                  {msg.insights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-xs items-start">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-muted/40 border rounded-xl p-3 space-y-1.5 max-w-[85%] animate-pulse">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Autonomous Agent Reasoning & Executing Tools...</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Introspecting schemas, validating queries, and building visual widgets in loops.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] text-muted-foreground shrink-0">Try:</span>
        <button
          type="button"
          onClick={() => setPrompt('Build a Viral Load Suppression and CD4 monitoring dashboard')}
          className="text-[10.5px] px-2 py-0.5 rounded-full bg-background border hover:border-primary shrink-0 transition-colors"
        >
          Viral Load Dashboard
        </button>
        <button
          type="button"
          onClick={() => setPrompt('Add a stat card showing overall average rejection rate')}
          className="text-[10.5px] px-2 py-0.5 rounded-full bg-background border hover:border-primary shrink-0 transition-colors"
        >
          Add Stat Card
        </button>
        <button
          type="button"
          onClick={() => setPrompt('Show me the top 5 laboratories by test throughput in 2023')}
          className="text-[10.5px] px-2 py-0.5 rounded-full bg-background border hover:border-primary shrink-0 transition-colors"
        >
          Top 5 Labs SQL
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-background flex items-center gap-2">
        <Input
          placeholder={
            activeTab === 'agent'
              ? 'Tell the AI agent what to build or change...'
              : 'Ask a data question or request SQL...'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="h-9 text-xs"
        />
        <Button type="submit" size="sm" disabled={isLoading || !prompt.trim()} className="h-9 gap-1 shrink-0">
          {isLoading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>Run</span>
        </Button>
      </form>
    </div>
  );
}
