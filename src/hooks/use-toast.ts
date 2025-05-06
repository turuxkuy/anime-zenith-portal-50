
import { useState, useEffect, useRef } from 'react';

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  open?: boolean;
};

type ToastState = ToastProps[];

export function useToast() {
  const [toasts, setToasts] = useState<ToastState>([]);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...toast, open: true }]);
    
    // Auto-dismiss toast after 5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
    
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => 
      prevToasts.map(toast => 
        toast.id === id ? { ...toast, open: false } : toast
      )
    );
    
    // Remove from state after animation (300ms)
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
    }, 300);
  };

  return {
    toasts,
    addToast,
    dismissToast,
  };
}

export const toast = {
  success: (props: Omit<ToastProps, "id">) => {
    // This is a simple implementation for the standalone usage
    // In a real app, this would use a context or a global state
    console.log("Toast success:", props);
    return "toast-id";
  },
  error: (props: Omit<ToastProps, "id">) => {
    console.log("Toast error:", props);
    return "toast-id";
  }
};
