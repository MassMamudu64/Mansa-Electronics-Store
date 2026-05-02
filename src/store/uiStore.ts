'use client';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIState {
  toasts: Toast[];
  showToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  showToast: ({ type, message }) =>
    set((state) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setTimeout(() => {
        useUIStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 2400);
      return { toasts: [...state.toasts, { id, type, message }] };
    }),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
