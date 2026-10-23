import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function SpotifyCallbackRoute() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#1ed760" size="large" />
      <Text style={styles.message}>Completing Spotify sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#121212',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#ffffff',
    fontSize: 16,
  },
});
