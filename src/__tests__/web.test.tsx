/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { prompt, configurePrompt } from '../RNPrompt.web';

const query = <T extends Element>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`No element for selector: ${selector}`);
  return el;
};

const click = (el: Element) =>
  el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );

const press = (key: string) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

describe('prompt (web)', () => {
  beforeEach(() => {
    configurePrompt({});
    document.body.innerHTML = '';
  });

  it('resolves with the entered value and fires onConfirm/onPress on OK', async () => {
    const onConfirm = jest.fn();
    const onPress = jest.fn();

    const pending = prompt({
      title: 'Enter your name',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', style: 'default', onPress },
      ],
      onConfirm,
    });

    query<HTMLInputElement>('.rnp-input').value = 'Bob';
    click(query('.rnp-button[data-rnp-style="default"]'));

    const result = await pending;
    expect(result.cancelled).toBe(false);
    expect(result.text).toBe('Bob');
    expect(result.buttonText).toBe('OK');
    expect(result.buttonIndex).toBe(1);
    expect(onConfirm).toHaveBeenCalledWith('Bob', undefined);
    expect(onPress).toHaveBeenCalledWith('Bob', undefined);
    // Cleans up the DOM after resolving.
    expect(document.querySelector('.rnp-overlay')).toBeNull();
  });

  it('resolves cancelled and fires onCancel when the cancel button is pressed', async () => {
    const onCancel = jest.fn();
    const pending = prompt({ title: 'Enter your name', onCancel });

    click(query('.rnp-button[data-rnp-style="cancel"]'));

    const result = await pending;
    expect(result.cancelled).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape', async () => {
    const onCancel = jest.fn();
    const pending = prompt({ title: 'Name', onCancel });

    press('Escape');

    const result = await pending;
    expect(result.cancelled).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirms on Enter (form submit)', async () => {
    const pending = prompt({ title: 'Name' });

    query<HTMLInputElement>('.rnp-input').value = 'Alice';
    query<HTMLFormElement>('.rnp-dialog').requestSubmit();

    const result = await pending;
    expect(result.cancelled).toBe(false);
    expect(result.text).toBe('Alice');
  });

  it('renders a password field and returns text + password for login-password', async () => {
    const pending = prompt({ title: 'Sign in', type: 'login-password' });

    const inputs = document.querySelectorAll<HTMLInputElement>('.rnp-input');
    expect(inputs).toHaveLength(2);
    inputs[0]!.value = 'user';
    inputs[1]!.value = 'secret';
    expect(inputs[1]!.type).toBe('password');

    query<HTMLFormElement>('.rnp-dialog').requestSubmit();

    const result = await pending;
    expect(result.text).toBe('user');
    expect(result.password).toBe('secret');
  });

  it('uses a password input for secure-text', async () => {
    const pending = prompt({ title: 'Password', type: 'secure-text' });
    expect(query<HTMLInputElement>('.rnp-input').type).toBe('password');
    click(query('.rnp-button[data-rnp-style="cancel"]'));
    await pending;
  });

  it('applies configurePrompt classNames overrides', async () => {
    configurePrompt({ classNames: { dialog: 'my-dialog', input: 'my-input' } });

    const pending = prompt({ title: 'Name' });
    expect(document.querySelector('.my-dialog')).not.toBeNull();
    expect(document.querySelector('.my-input')).not.toBeNull();

    click(query('.my-dialog .rnp-button[data-rnp-style="cancel"]'));
    await pending;
  });

  it('mounts custom markup from configurePrompt render and resolves via context', async () => {
    configurePrompt({
      render: (ctx) => {
        const el = document.createElement('div');
        el.className = 'custom-prompt';
        const ok = document.createElement('button');
        ok.className = 'custom-ok';
        ok.addEventListener('click', () => ctx.confirm(1, 'from-custom'));
        el.appendChild(ok);
        return el;
      },
    });

    const pending = prompt({ title: 'Name' });
    expect(document.querySelector('.custom-prompt')).not.toBeNull();
    expect(document.querySelector('.rnp-dialog')).toBeNull();

    click(query('.custom-ok'));
    const result = await pending;
    expect(result.text).toBe('from-custom');
  });
});
