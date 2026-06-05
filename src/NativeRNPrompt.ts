import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  showPrompt(options: {
    title: string;
    message: string;
    type: string;
    defaultValue: string;
    placeholder: string;
    passwordPlaceholder: string;
    tintColor: string;
    buttons: Array<{ text: string; style: string }>;
  }): Promise<{
    cancelled?: boolean;
    text?: string;
    password?: string;
    buttonIndex?: number;
    buttonText?: string;
  }>;
}

// New Arch spec. The native module resolves the Promise with the result; there
// is no DeviceEventEmitter side-channel.
export default TurboModuleRegistry.get<Spec>('RNPrompt');
