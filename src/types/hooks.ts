/**
 * Type definitions for React hooks
 * Types used by custom hooks and hook utilities
 */

import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

/**
 * Toast action element type
 */
export type ToastActionElement = React.ReactElement;

/**
 * Toaster toast type with all properties
 */
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * Toast state
 */
export interface ToastState {
  toasts: ToasterToast[];
}

/**
 * Toast action types
 */
export const toastActionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

export type ToastActionType = typeof toastActionTypes;

/**
 * Toast actions
 */
export type ToastAction =
  | {
      type: ToastActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ToastActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ToastActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ToastActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

