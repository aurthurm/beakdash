import React from 'react';
import { Bot } from 'lucide-react';
import { useAICopilotStore } from '@/app/store/copilotStore';
import { IWidget } from '@/app/lib/drizzle/schemas';
import { useDatasetStore } from '@/app/store/datasets';

interface AICopilotButtonProps {
  widget?: IWidget;
  variant?: 'button' | 'icon';
  userId: string;
  pageId: string;
}

const AICopilotButton: React.FC<AICopilotButtonProps> = ({ widget, variant = 'icon', userId, pageId }) => {
  const { toggleChat, setContext } = useAICopilotStore();
  const { datasets } = useDatasetStore();

  const handleClick = () => {
    if(widget) {
      const dataset = datasets.find(d => d.id === widget.datasetId);
      setContext({ type: 'widget', widget, dataset, userId, pageId });
    } else {
      setContext({ type: 'new', userId, pageId });
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