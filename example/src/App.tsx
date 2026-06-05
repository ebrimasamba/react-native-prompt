import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { prompt } from '@ebrimasamba/react-native-prompt';

export default function App() {
  const [result, setResult] = useState('—');

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
