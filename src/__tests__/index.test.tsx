import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Platform } from 'react-native';
import NativeRNPrompt from '../NativeRNPrompt';
import { prompt } from '../index';

// Stub the TurboModule so the Android path is exercised without native code.
jest.mock('../NativeRNPrompt', () => ({
  __esModule: true,
  default: { showPrompt: jest.fn() },
}));

const showPrompt = jest.mocked(NativeRNPrompt!).showPrompt;

describe('prompt (Android)', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'android';
    showPrompt.mockReset();
  });

  it('resolves with the entered value and fires onConfirm on a non-cancel button', async () => {
    showPrompt.mockResolvedValue({
      text: 'Bob',
      password: '',
      buttonIndex: 1,
      buttonText: 'OK',
    });
    const onConfirm = jest.fn();

    const result = await prompt({
      title: 'Enter your name',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', style: 'default' },
      ],
      onConfirm,
    });

    expect(result.cancelled).toBe(false);
    expect(result.text).toBe('Bob');
    expect(result.buttonText).toBe('OK');
    expect(result.buttonIndex).toBe(1);
    expect(onConfirm).toHaveBeenCalledWith('Bob', '');
  });

  it('resolves cancelled and fires onCancel when a cancel button is reported', async () => {
    showPrompt.mockResolvedValue({ cancelled: true });
    const onCancel = jest.fn();

    const result = await prompt({ title: 'Enter your name', onCancel });

    expect(result).toEqual({ cancelled: true });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
