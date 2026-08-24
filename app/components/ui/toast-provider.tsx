import React, { useState, useEffect, createContext } from 'react';
import { ToasterToast } from '@/lib/hooks/use-toast';
import { ToastProvider as UIToastProvider, ToastViewport } from './toast';
import { Toast, ToastTitle, ToastDescription, ToastClose } from './toast';

export interface ToastContextType {
  toasts: ToasterToast[];
  addToast: (toast: Omit<ToasterToast, 'id'>) => string;
  updateToast: (id: string, toast: Partial<ToasterToast>) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_REMOVE_DELAY = 3000;


export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const addToast = (toast: Omit<ToasterToast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }]);
    return id;
  };

  const updateToast = (id: string, toast: Partial<ToasterToast>) => {
    setToasts((prevToasts) =>
      prevToasts.map((t) => (t.id === id ? { ...t, ...toast } : t))
    );
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dismissToast(toast.id);
      }, TOAST_REMOVE_DELAY);

      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    updateToast,
    dismissToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <UIToastProvider>
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </UIToastProvider>
    </ToastContext.Provider>
  );
}