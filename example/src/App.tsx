import { useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { prompt } from '@ebrimasamba/react-native-prompt';

// On web the prompt ships unstyled — these CSS rules target its stable class
// hooks to theme it. This is the customization story; native ignores it.
const WEB_PROMPT_CSS = `
  .rnp-overlay { background: rgba(0, 0, 0, 0.45); }
  .rnp-dialog {
    min-width: 280px;
    padding: 20px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    font-family: system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rnp-title { margin: 0; font-size: 18px; }
  .rnp-message { margin: 0; color: #555; font-size: 14px; }
  .rnp-input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
  }
  .rnp-buttons { display: flex; justify-content: flex-end; gap: 8px; }
  .rnp-button {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    background: #eee;
  }
  .rnp-button[data-rnp-style="default"] { background: #2563eb; color: #fff; }
  .rnp-button[data-rnp-style="destructive"] { background: #dc2626; color: #fff; }
`;

export default function App() {
  const [result, setResult] = useState('—');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = WEB_PROMPT_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const showPrompt = async () => {
    const res = await prompt({
      title: 'Enter your name',
      message: 'We use this to greet you.',
      type: 'plain-text',
      placeholder: 'Name',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', style: 'default' },
      ],
    });

    setResult(res.cancelled ? 'Cancelled' : (res.text ?? ''));
  };

  return (
    <View style={styles.container}>
      <Button title="Show prompt" onPress={showPrompt} />
      <Text style={styles.result}>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  result: {
    fontSize: 16,
  },
});
