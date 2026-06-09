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

export interface PromptResult {
  /** True when the prompt was dismissed via a cancel-styled button. */
  cancelled: boolean;
  text?: string;
  password?: string;
  buttonIndex?: number;
  buttonText?: string;
}

/**
 * Stable class names applied to the web prompt's DOM nodes. The prompt ships
 * unstyled, so these are the primary hook for theming via CSS. Override any of
 * them through {@link configurePrompt}.
 */
export interface PromptWebClassNames {
  /** Full-screen backdrop behind the dialog. */
  overlay: string;
  /** The dialog container (`role="dialog"`). */
  dialog: string;
  /** Title element. */
  title: string;
  /** Message/body element. */
  message: string;
  /** Wrapper around a single input. */
  field: string;
  /** Text / password `<input>`. */
  input: string;
  /** Container holding the action buttons. */
  buttons: string;
  /** A single action `<button>`. */
  button: string;
}

/**
 * Passed to a custom {@link PromptWebConfig.render} function. It exposes the
 * caller's options plus the resolved button list and the `confirm` / `cancel`
 * callbacks the custom markup must wire up to resolve the prompt.
 */
export interface PromptRenderContext {
  options: PromptOptions;
  buttons: PromptButton[];
  classNames: PromptWebClassNames;
  /** Resolve the prompt as a non-cancel action for the given button index. */
  confirm(buttonIndex: number, text: string, password?: string): void;
  /** Resolve the prompt as cancelled. */
  cancel(buttonIndex?: number): void;
}

/**
 * Web-only customization for {@link prompt}. `classNames` overrides the default
 * CSS hooks; `render` lets you replace the built-in markup entirely — return
 * the dialog element to mount, or omit the return to fall back to the default.
 */
export interface PromptWebConfig {
  classNames?: Partial<PromptWebClassNames>;
  render?(context: PromptRenderContext): HTMLElement | void;
}
