import * as Haptics from 'expo-haptics';

export const tapHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const successHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

export const warningHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

export const errorHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};

export const selectionHaptic = () => {
  Haptics.selectionAsync().catch(() => {});
};

export const heavyHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};
