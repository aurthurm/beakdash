// components/AICopilotChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Minimize2, Maximize2, Loader, Database } from 'lucide-react';
import { useAICopilotStore } from '@/app/store/copilotStore';

import ReactMarkdown from 'react-markdown';
import { useDatasetStore } from '@/app/store/datasets';
import { useAuth } from '@clerk/nextjs';
import { ChartContext } from '@/app/types/copilot';

const AICopilotChat: React.FC = () => {
  const {
    isOpen,
    isLoading,
    messages,
    context,
    setContext,
    toggleChat,
    addMessage,
    clearAll,
    invokeCopilot,
  } = useAICopilotStore();
  const { userId } = useAuth()
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const { datasets , fetchDatasets } = useDatasetStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available datasets
  useEffect(() => {
    fetchDatasets(userId!);
  }, [fetchDatasets, userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const onChangeDataset = (datasetId: string) => {
    setContext({
      ...(context || {}),
      dataset: datasets.find(d => d.id === datasetId)
    }as ChartContext);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !context) return;

    const userMessage = input;
    setInput('');
    
    addMessage({
      role: 'user',
      content: userMessage
    });

    try {
      await invokeCopilot()
    } catch (error) {
      console.log('Chat error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed right-4 bottom-4 bg-white rounded-lg shadow-xl ${
            isMinimized ? 'w-64 h-12' : 'w-96 h-[600px]'
          } flex flex-col overflow-hidden z-50`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">
              AI Copilot {context?.type === 'widget' ? '- Edit Mode' : '- Create Mode'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => {
                  toggleChat();
                  clearAll();
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Dataset Selection */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-gray-500" />
                  <select
                    value={context?.dataset?.id || ''}
                    onChange={(e) => onChangeDataset(e.target.value)}
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a dataset</option>
                    {datasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      !context?.dataset?.id
                        ? "Select a dataset first..."
                        : context?.type === 'widget'
                        ? "Ask how to modify this chart..."
                        : "Describe the chart you'd like to create..."
                    }
                    disabled={isLoading || !context?.dataset?.id}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || !context?.dataset?.id}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AICopilotChat;