/**
 * uiStore · 全局 loading/toast/modal（内存态）
 */
import { create } from 'zustand';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface UiState {
  toasts: ToastItem[];
  modal: { open: boolean; content: ReactNode | null; onClose?: () => void };
  loadingKeys: Record<string, boolean>;
  drawerOpen: boolean;

  showToast: (type: ToastType, message: string) => void;
  hideToast: (id: number) => void;
  openModal: (content: ReactNode, onClose?: () => void) => void;
  closeModal: () => void;
  setLoading: (key: string, value: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  modal: { open: false, content: null },
  loadingKeys: {},
  drawerOpen: false,

  showToast(type, message) {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().hideToast(id), 2600);
  },

  hideToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  openModal(content, onClose) {
    set({ modal: { open: true, content, onClose } });
  },

  closeModal() {
    const { modal } = get();
    modal.onClose?.();
    set({ modal: { open: false, content: null, onClose: undefined } });
  },

  setLoading(key, value) {
    set({ loadingKeys: { ...get().loadingKeys, [key]: value } });
  },

  openDrawer() {
    set({ drawerOpen: true });
  },

  closeDrawer() {
    set({ drawerOpen: false });
  },

  toggleDrawer() {
    set({ drawerOpen: !get().drawerOpen });
  },
}));
