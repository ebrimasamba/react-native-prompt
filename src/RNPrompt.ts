// RNPrompt.ts — JS bridge layer routing iOS vs Android

import { Alert, Platform } from 'react-native';
import NativeRNPrompt from './NativeRNPrompt';
import type { PromptButton, PromptOptions, PromptResult } from './types';

// Mirrors iOS Alert.prompt's default Cancel/OK pair when the caller omits buttons.
const DEFAULT_BUTTONS: PromptButton[] = [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK', style: 'default' },
];

/**
 * Show a native text prompt. On iOS this delegates to the built-in
 * `Alert.prompt`; on Android it calls the native `RNPromptDialog` module.
 * Resolves with a {@link PromptResult} and also fires the per-button / option
 * callbacks declared in {@link PromptOptions}.
 */
export function prompt(options: PromptOptions): Promise<PromptResult> {
  if (Platform.OS === 'web') {
    return Promise.reject(
      new Error('@ebrimasamba/react-native-prompt is not supported on web.')
    );
  }
  const buttons = options.buttons?.length ? options.buttons : DEFAULT_BUTTONS;
  return Platform.OS === 'ios'
    ? promptIOS(options, buttons)
    : promptAndroid(options, buttons);
}

function promptIOS(
  options: PromptOptions,
  buttons: PromptButton[]
): Promise<PromptResult> {
  return new Promise((resolve) => {
    const iosButtons = buttons.map((button, index) => ({
      text: button.text,
      style: button.style,
      onPress: (value?: string | { login: string; password: string }) => {
        const { text, password } = extractValue(value);
        resolve(finalizeResult(options, buttons, index, text, password));
      },
    }));

    Alert.prompt(
      options.title,
      options.message,
      iosButtons,
      (options.type ?? 'plain-text') as
        | 'default'
        | 'plain-text'
        | 'secure-text'
        | 'login-password',
      options.defaultValue,
      options.keyboardType as never
    );
  });
}

async function promptAndroid(
  options: PromptOptions,
  buttons: PromptButton[]
): Promise<PromptResult> {
  if (NativeRNPrompt == null) {
    throw new Error(
      "The 'RNPrompt' native module is unavailable. Rebuild the app after " +
        'installing @ebrimasamba/react-native-prompt.'
    );
  }

  const native = await NativeRNPrompt.showPrompt({
    title: options.title,
    message: options.message ?? '',
    type: options.type ?? 'plain-text',
    defaultValue: options.defaultValue ?? '',
    placeholder: options.placeholder ?? '',
    passwordPlaceholder: options.passwordPlaceholder ?? '',
    tintColor: options.tintColor ?? '',
    buttons: buttons.map((button) => ({
      text: button.text,
      style: button.style ?? 'default',
    })),
  });

  if (native.cancelled) {
    options.onCancel?.();
    return { cancelled: true };
  }

  return finalizeResult(
    options,
    buttons,
    native.buttonIndex ?? 0,
    native.text ?? '',
    native.password
  );
}

function finalizeResult(
  options: PromptOptions,
  buttons: PromptButton[],
  buttonIndex: number,
  text: string,
  password?: string
): PromptResult {
  const button = buttons[buttonIndex];

  if (button?.style === 'cancel') {
    options.onCancel?.();
    return { cancelled: true };
  }

  button?.onPress?.(text, password);
  options.onConfirm?.(text, password);

  return {
    cancelled: false,
    text,
    password,
    buttonIndex,
    buttonText: button?.text,
  };
}

function extractValue(value?: string | { login: string; password: string }): {
  text: string;
  password?: string;
} {
  if (value && typeof value === 'object') {
    return { text: value.login, password: value.password };
  }
  return { text: value ?? '' };
}
