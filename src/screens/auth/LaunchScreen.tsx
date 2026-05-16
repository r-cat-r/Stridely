/**
 * Launch Screen / Onboarding Splash
 *
 * First screen the user sees. Displays an inspirational background image,
 * a gradient overlay, branding text, and a call to action.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Launch'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function LaunchScreen({ navigation }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
        source={require('../../../assets/launch-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlay to transition into the dark background */}
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.overlay}
          locations={[0, 0.8]}
        />
        
        <View style={styles.content}>
          {/* Typography */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Find Your Game, Find Your People</Text>
            <Text style={styles.subtitle}>Where training meets community</Text>
          </View>

          {/* Carousel Indicators */}
          <View style={styles.carouselContainer}>
            <View style={styles.indicatorTrack}>
              <View style={[styles.indicatorActive, { backgroundColor: '#F89DFF' }]} />
            </View>
            <View style={styles.indicatorTrack}>
              <View style={[styles.indicatorInactive, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.indicatorTrack}>
              <View style={[styles.indicatorInactive, { backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'] + 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    ...typography.displayLarge,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'capitalize',
    fontSize: 28,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  carouselContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['4xl'],
    gap: 8,
  },
  indicatorTrack: {
    width: 21,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  indicatorActive: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
  },
  indicatorInactive: {
    width: 0, // Hidden for inactive dots based on user CSS 'visibility: hidden' for the color part, but we can just show the track
    height: '100%',
    borderRadius: borderRadius.full,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#BBF246',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BBF246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    ...typography.h3,
    color: '#192126',
    fontWeight: '800',
  },
});
