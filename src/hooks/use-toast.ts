
import { useState, useEffect, useCallback } from "react";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(({ ...props }: ToastProps) => {
    const id = props.id || String(Date.now());
    
    setToasts((currentToasts) => [
      ...currentToasts,
      { ...props, id },
    ]);

    return id;
  }, []);

  const dismiss = useCallback((id?: string) => {
    setToasts((currentToasts) => 
      id ? currentToasts.filter((toast) => toast.id !== id) : []
    );
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
};

export type Toast = ReturnType<typeof useToast>;
