# @ebrimasamba/react-native-prompt

A cross platform prompt alert for both android and ios

## Installation


```sh
npm install @ebrimasamba/react-native-prompt
```


## Usage

```ts
import { prompt } from '@ebrimasamba/react-native-prompt';

const result = await prompt({
  title: 'Enter your name',
  message: 'We use this to greet you.',
  type: 'plain-text',
  placeholder: 'Name',
  buttons: [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', style: 'default' },
  ],
});

if (!result.cancelled) {
  console.log('Hello,', result.text);
}
```

`prompt(options)` returns a `Promise<PromptResult>`. On iOS it delegates to the
built-in `Alert.prompt`; on Android it shows a native `AlertDialog`.

### Options

| Field | Type | Notes |
| --- | --- | --- |
| `title` | `string` | Required. |
| `message` | `string?` | Optional body text. |
| `type` | `'default' \| 'plain-text' \| 'secure-text' \| 'login-password'` | Defaults to `plain-text`. |
| `defaultValue` | `string?` | Pre-filled input value. |
| `placeholder` | `string?` | Input hint (Android). |
| `passwordPlaceholder` | `string?` | Password field hint for `login-password` (Android). |
| `keyboardType` | `string?` | iOS only (passed to `Alert.prompt`). |
| `buttons` | `PromptButton[]?` | Up to 3; defaults to Cancel/OK. |
| `tintColor` | `string?` | Android accent color for the confirm button. |
| `onConfirm` / `onCancel` | callbacks | Fired alongside the resolved Promise. |

### Result

```ts
type PromptResult = {
  cancelled: boolean;
  text?: string;
  password?: string;
  buttonIndex?: number;
  buttonText?: string;
};
```


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
