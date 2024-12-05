import React from 'react';
import { Bot } from 'lucide-react';
import { useAICopilotStore } from '@/app/store/aiCopilotStore';

interface AICopilotButtonProps {
  context?: string;
  widgetId?: string;
  variant?: 'button' | 'icon';
}

const AICopilotButton: React.FC<AICopilotButtonProps> = ({ context, widgetId, variant = 'icon' }) => {
  const { toggleChat, setContext } = useAICopilotStore();

  const handleClick = () => {
    if (context) {
      setContext({ type: 'widget', id: widgetId, context });
    }
    toggleChat();
  };

  return (
    variant === 'button' ? (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Bot size={20} />
        AI Copilot
      </button>
    ) :
    <button
      onClick={handleClick}
      className="p-1 hover:bg-gray-100 rounded-full text-gray-600 hover:text-blue-600 transition-colors"
      title="AI Copilot"
    >
      <Bot size={16} />
    </button>
  );
};

export default AICopilotButton;