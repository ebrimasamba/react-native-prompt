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
  }): void;
}

// Callbacks (confirm/cancel/button press) are delivered via DeviceEventEmitter,
// not return values — keeps the codegen surface lean.
export default TurboModuleRegistry.get<Spec>('RNPrompt');
