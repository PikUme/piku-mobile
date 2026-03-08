import { ActionSheetIOS, Alert, AlertButton, Platform } from 'react-native';

export interface ActionSheetOption {
  label: string;
  onPress?: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface ActionSheetParams {
  title?: string;
  message?: string;
  options: ActionSheetOption[];
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  Alert.alert(title, message, buttons);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) {
  Alert.alert(title, message, [
    {
      text: '취소',
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: '확인',
      onPress: onConfirm,
    },
  ]);
}

export function showActionSheet({
  title,
  message,
  options,
}: ActionSheetParams) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: options.map((option) => option.label),
        cancelButtonIndex: options.findIndex((option) => option.style === 'cancel'),
        destructiveButtonIndex: options.findIndex(
          (option) => option.style === 'destructive',
        ),
      },
      (selectedIndex) => {
        if (selectedIndex < 0) {
          return;
        }

        options[selectedIndex]?.onPress?.();
      },
    );
    return;
  }

  Alert.alert(
    title ?? '옵션 선택',
    message,
    options.map((option) => ({
      text: option.label,
      style: option.style === 'default' ? undefined : option.style,
      onPress: option.onPress,
    })),
  );
}
