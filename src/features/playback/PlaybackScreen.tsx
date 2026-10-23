import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../../components/Screen';
import { useAuth } from '../auth/AuthProvider';
import { useCurrentPlayback } from './useCurrentPlayback';

interface ActionButtonProps {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

function ActionButton({
  disabled = false,
  label,
  onPress,
  variant = 'primary',
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        (pressed || disabled) && styles.buttonMuted,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === 'secondary' && styles.secondaryButtonLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PlaybackScreen() {
  const { error: authError, signIn, signOut, status } = useAuth();
  const {
    error: playbackError,
    isLoading,
    playback,
    refresh,
  } = useCurrentPlayback();

  if (status === 'restoring') {
    return (
      <Screen>
        <ActivityIndicator color="#1ed760" size="large" />
        <Text style={styles.message}>Restoring Spotify session…</Text>
      </Screen>
    );
  }

  if (status === 'signedOut' || status === 'signingIn') {
    return (
      <Screen>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>
            Spotify Queue Shuffler
          </Text>
          <Text style={styles.message}>
            Sign in to see what is playing on your active Spotify device.
          </Text>
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          <ActionButton
            disabled={status === 'signingIn'}
            label={
              status === 'signingIn' ? 'Opening Spotify…' : 'Sign in with Spotify'
            }
            onPress={() => void signIn()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.eyebrow}>
          CURRENT PLAYBACK
        </Text>

        {isLoading && !playback ? (
          <ActivityIndicator color="#1ed760" size="large" />
        ) : playback ? (
          <View style={styles.playbackCard}>
            {playback.item?.imageUrl ? (
              <Image
                accessibilityLabel={`${playback.item.title} artwork`}
                source={{ uri: playback.item.imageUrl }}
                style={styles.artwork}
              />
            ) : null}
            <Text style={styles.playbackTitle}>
              {playback.item?.title ?? 'Nothing currently playing'}
            </Text>
            {playback.item ? (
              <Text style={styles.playbackSubtitle}>
                {playback.item.subtitle}
              </Text>
            ) : null}
            <Text style={styles.device}>
              {playback.isPlaying ? 'Playing' : 'Paused'} on{' '}
              {playback.device.name} · {playback.device.type}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyState}>No Device Playing</Text>
        )}

        {playbackError ? <Text style={styles.error}>{playbackError}</Text> : null}

        <View style={styles.actions}>
          <ActionButton
            disabled={isLoading}
            label={isLoading ? 'Refreshing…' : 'Refresh'}
            onPress={() => void refresh()}
          />
          <ActionButton
            label="Sign out"
            onPress={() => void signOut()}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    width: '100%',
  },
  artwork: {
    borderRadius: 12,
    height: 240,
    width: 240,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1ed760',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
  },
  buttonLabel: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonMuted: {
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    gap: 24,
    maxWidth: 480,
    width: '100%',
  },
  device: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  emptyState: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: '#ff8a8a',
    fontSize: 14,
    textAlign: 'center',
  },
  eyebrow: {
    color: '#1ed760',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  message: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
  },
  playbackCard: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  playbackSubtitle: {
    color: '#b3b3b3',
    fontSize: 18,
    textAlign: 'center',
  },
  playbackTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#727272',
    borderWidth: 1,
  },
  secondaryButtonLabel: {
    color: '#ffffff',
  },
  title: {
    color: '#1ed760',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
});
