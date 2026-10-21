import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function Screen({ children }: PropsWithChildren) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#121212',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
