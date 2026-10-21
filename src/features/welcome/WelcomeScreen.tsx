import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../components/Screen';

export function WelcomeScreen() {
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        Spotify Queue Shuffler
      </Text>
      <Text style={styles.subtitle}>Hello, world.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: '#b3b3b3',
    fontSize: 18,
    marginTop: 8,
  },
  title: {
    color: '#1ed760',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
});
