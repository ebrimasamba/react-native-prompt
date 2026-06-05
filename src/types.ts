// types.ts — shared TypeScript types for the prompt API

export type PromptType =
  | 'default'
  | 'plain-text'
  | 'secure-text'
  | 'login-password';

export interface PromptButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?(value?: string, password?: string): void;
}

export interface PromptOptions {
  title: string;
  message?: string;
  type?: PromptType;
  defaultValue?: string;
  placeholder?: string;
  passwordPlaceholder?: string;
  keyboardType?: string;
  buttons?: PromptButton[];
  onConfirm?(text: string, password?: string): void;
  onCancel?(): void;
  /** Android accent color for confirm button */
  tintColor?: string;
}
