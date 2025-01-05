import { IWidget } from '@/app/lib/drizzle/schemas';
import React from 'react';

interface WidgetSkeletonProps {
  type: IChart;
}

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ type }) => {
  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-gray-50 animate-pulse">
      <div className="w-full h-full">
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-1/4 bg-gray-200 rounded mb-6" />
        
        {type !== 'count' ? (
          <div className="w-full h-[calc(100%-4rem)] bg-white rounded-lg p-4">
            <div className="w-full h-full flex flex-col gap-2">
              <div className="w-full h-8 bg-gray-200 rounded" />
              <div className="flex-1 flex items-end">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 rounded-t mx-1"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[calc(100%-4rem)] flex flex-col justify-center items-center">
            <div className="h-12 w-1/2 bg-gray-200 rounded mb-4" />
            <div className="h-6 w-1/4 bg-gray-200 rounded" />
          </div>
        )}
      </div>
    </div>
  );
};