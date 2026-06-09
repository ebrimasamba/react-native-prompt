// RNPrompt.web.ts — web implementation.
//
// There is no native prompt on the web and `prompt()` is called imperatively
// (outside the React tree), so this builds its own modal with vanilla DOM,
// resolves the Promise on an action, and tears itself down. It ships unstyled:
// the only inline styles are what's needed to position the overlay. Everything
// else is themed via the stable class names / `data-rnp-*` hooks below, or
// replaced entirely through `configurePrompt({ render })`.

import type {
  PromptButton,
  PromptOptions,
  PromptResult,
  PromptRenderContext,
  PromptWebClassNames,
  PromptWebConfig,
} from './types';

// Mirrors iOS Alert.prompt's default Cancel/OK pair when the caller omits buttons.
const DEFAULT_BUTTONS: PromptButton[] = [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK', style: 'default' },
];

const DEFAULT_CLASS_NAMES: PromptWebClassNames = {
  overlay: 'rnp-overlay',
  dialog: 'rnp-dialog',
  title: 'rnp-title',
  message: 'rnp-message',
  field: 'rnp-field',
  input: 'rnp-input',
  buttons: 'rnp-buttons',
  button: 'rnp-button',
};

let config: PromptWebConfig = {};

/**
 * Customize the web prompt. `classNames` overrides the default CSS hooks;
 * `render` replaces the built-in markup. Call once at app startup.
 */
export function configurePrompt(next: PromptWebConfig): void {
  config = next ?? {};
}

/**
 * Show a prompt on the web. Returns a {@link PromptResult} and fires the
 * per-button / option callbacks, matching the native platforms' behavior.
 */
export function prompt(options: PromptOptions): Promise<PromptResult> {
  if (typeof document === 'undefined') {
    return Promise.reject(
      new Error(
        '@ebrimasamba/react-native-prompt: web prompt requires a DOM ' +
          '(document is undefined — are you rendering on the server?).'
      )
    );
  }

  const buttons = options.buttons?.length ? options.buttons : DEFAULT_BUTTONS;
  const classNames: PromptWebClassNames = {
    ...DEFAULT_CLASS_NAMES,
    ...config.classNames,
  };
  const type = options.type ?? 'plain-text';
  const showPassword = type === 'secure-text' || type === 'login-password';

  return new Promise<PromptResult>((resolve) => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    let settled = false;

    const overlay = document.createElement('div');
    overlay.className = classNames.overlay;
    // Minimal positioning only — appearance is left to the consumer's CSS.
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2147483647';

    const cleanup = () => {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      previouslyFocused?.focus?.();
    };

    const finalize = (buttonIndex: number, text: string, password?: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(finalizeResult(options, buttons, buttonIndex, text, password));
    };

    // Resolve as cancelled, firing onCancel. Used by Escape and cancel buttons.
    const cancel = (buttonIndex?: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      options.onCancel?.();
      resolve(
        buttonIndex == null
          ? { cancelled: true }
          : { cancelled: true, buttonIndex }
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        const cancelIndex = buttons.findIndex((b) => b.style === 'cancel');
        cancel(cancelIndex >= 0 ? cancelIndex : undefined);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    const context: PromptRenderContext = {
      options,
      buttons,
      classNames,
      confirm: finalize,
      cancel,
    };

    // Custom render escape hatch: mount whatever the consumer returns.
    const custom = config.render?.(context);
    if (custom) {
      overlay.appendChild(custom);
      document.body.appendChild(overlay);
      focusFirst(custom);
      return;
    }

    const dialog = buildDialog({
      options,
      buttons,
      classNames,
      type,
      showPassword,
      onConfirm: finalize,
      onCancel: cancel,
    });
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    focusFirst(dialog);
  });
}

interface DialogParams {
  options: PromptOptions;
  buttons: PromptButton[];
  classNames: PromptWebClassNames;
  type: NonNullable<PromptOptions['type']>;
  showPassword: boolean;
  onConfirm(buttonIndex: number, text: string, password?: string): void;
  onCancel(buttonIndex?: number): void;
}

function buildDialog(params: DialogParams): HTMLFormElement {
  const { options, buttons, classNames, type, showPassword } = params;

  const form = document.createElement('form');
  form.className = classNames.dialog;
  form.setAttribute('role', 'dialog');
  form.setAttribute('aria-modal', 'true');
  form.setAttribute('data-rnp-type', type);

  const titleId = `rnp-title-${Math.random().toString(36).slice(2)}`;
  if (options.title) {
    const title = document.createElement('h2');
    title.className = classNames.title;
    title.id = titleId;
    title.textContent = options.title;
    form.appendChild(title);
    form.setAttribute('aria-labelledby', titleId);
  }

  if (options.message) {
    const message = document.createElement('p');
    message.className = classNames.message;
    message.textContent = options.message;
    form.appendChild(message);
  }

  // `default` is a message-only alert with no text field, mirroring iOS.
  const textInput =
    type === 'default'
      ? null
      : appendInput(form, classNames, {
          inputType:
            showPassword && type === 'secure-text' ? 'password' : 'text',
          placeholder: options.placeholder,
          value: options.defaultValue,
          name: 'rnp-text',
        });

  const passwordInput =
    type === 'login-password'
      ? appendInput(form, classNames, {
          inputType: 'password',
          placeholder: options.passwordPlaceholder,
          name: 'rnp-password',
        })
      : null;

  const readValues = () => ({
    text: textInput?.value ?? '',
    password:
      type === 'login-password' ? (passwordInput?.value ?? '') : undefined,
  });

  const buttonRow = document.createElement('div');
  buttonRow.className = classNames.buttons;

  buttons.forEach((button, index) => {
    const el = document.createElement('button');
    el.className = classNames.button;
    el.textContent = button.text;
    el.setAttribute('data-rnp-style', button.style ?? 'default');
    // Only a non-cancel button submits the form (so Enter triggers confirm).
    el.type = button.style === 'cancel' ? 'button' : 'submit';
    el.addEventListener('click', (event) => {
      if (button.style === 'cancel') {
        event.preventDefault();
        params.onCancel(index);
        return;
      }
      // For submit buttons let the form's submit handler resolve, but record
      // which button was pressed first.
      pressedIndex = index;
    });
    buttonRow.appendChild(el);
  });

  let pressedIndex = buttons.findIndex((b) => b.style !== 'cancel');
  if (pressedIndex < 0) pressedIndex = 0;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { text, password } = readValues();
    params.onConfirm(pressedIndex, text, password);
  });

  form.appendChild(buttonRow);
  return form;
}

function appendInput(
  form: HTMLFormElement,
  classNames: PromptWebClassNames,
  opts: {
    inputType: 'text' | 'password';
    placeholder?: string;
    value?: string;
    name: string;
  }
): HTMLInputElement {
  const field = document.createElement('div');
  field.className = classNames.field;

  const input = document.createElement('input');
  input.className = classNames.input;
  input.type = opts.inputType;
  input.name = opts.name;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  if (opts.value) input.value = opts.value;

  field.appendChild(input);
  form.appendChild(field);
  return input;
}

function focusFirst(root: HTMLElement) {
  const input = root.querySelector<HTMLElement>('input, button');
  input?.focus();
}

// Same result/callback semantics as the native path in RNPrompt.ts.
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
