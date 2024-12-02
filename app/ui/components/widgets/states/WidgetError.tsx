import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WidgetErrorProps {
  message: string;
  onRetry?: () => void;
  onEdit?: () => void;
}

export const WidgetError: React.FC<WidgetErrorProps> = ({ message, onRetry, onEdit }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-red-50">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-700 mb-2">Widget Error</h3>
      <p className="text-red-600 text-center">{message}</p>
      {onRetry && (<div className='flex justify-start items-center gap-x-4'>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onEdit}
          className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Edit
        </button>
      </div>)}
    </div>
  );
};