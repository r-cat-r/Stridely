/**
 * Swipeable card stack - gesture-based discovery
 *
 * Only the top card (index 0) is interactive with gestures and action buttons.
 * Cards behind are rendered as a visual stack with pointerEvents disabled.
 */

import React, { useCallback } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DiscoveryCard } from './DiscoveryCard';
import type { DiscoveryMatch } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

interface SwipeableCardStackProps {
  matches: DiscoveryMatch[];
  onInvite: (match: DiscoveryMatch) => void;
  onSkip: (match: DiscoveryMatch) => void;
  onViewProfile: (match: DiscoveryMatch) => void;
}

export function SwipeableCardStack({
  matches,
  onInvite,
  onSkip,
  onViewProfile,
}: SwipeableCardStackProps): React.JSX.Element {
  // Show at most 3 cards in the visual stack
  const visibleCards = matches.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Render in reverse so the first card (index 0) is on top */}
      {visibleCards
        .slice()
        .reverse()
        .map((match, reverseIndex) => {
          const index = visibleCards.length - 1 - reverseIndex;
          const isTopCard = index === 0;

          if (isTopCard) {
            return (
              <TopSwipeableCard
                key={match.user.id}
                match={match}
                onSwipeRight={() => onInvite(match)}
                onSwipeLeft={() => onSkip(match)}
                onViewProfile={() => onViewProfile(match)}
              />
            );
          }

          return (
            <View
              key={match.user.id}
              pointerEvents="none"
              style={[
                styles.cardWrapper,
                {
                  zIndex: visibleCards.length - index,
                  top: index * 8,
                  transform: [{ scale: 1 - index * 0.05 }],
                },
              ]}
            >
              <View style={styles.card}>
                <DiscoveryCard match={match} />
              </View>
            </View>
          );
        })}
    </View>
  );
}

/** The top card with gesture handling and action buttons */
function TopSwipeableCard({
  match,
  onSwipeRight,
  onSwipeLeft,
  onViewProfile,
}: {
  match: DiscoveryMatch;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onViewProfile: () => void;
}): React.JSX.Element {
  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const triggerInvite = useCallback(() => onSwipeRight(), [onSwipeRight]);
  const triggerSkip = useCallback(() => onSwipeLeft(), [onSwipeLeft]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotateZ.value = (e.translationX / SCREEN_WIDTH) * 0.15;
    })
    .onEnd((e) => {
      const shouldInvite = translateX.value > SWIPE_THRESHOLD || e.velocityX > 500;
      const shouldSkip = translateX.value < -SWIPE_THRESHOLD || e.velocityX < -500;

      if (shouldInvite) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.2, SPRING_CONFIG, () => {
          runOnJS(triggerInvite)();
        });
      } else if (shouldSkip) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.2, SPRING_CONFIG, () => {
          runOnJS(triggerSkip)();
        });
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        rotateZ.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotateZ.value}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardWrapper, { zIndex: 100 }]}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <DiscoveryCard match={match} />
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => {
                translateX.value = withSpring(-SCREEN_WIDTH * 1.2, SPRING_CONFIG, () => {
                  runOnJS(triggerSkip)();
                });
              }}
              icon="close"
              style={styles.skipBtn}
              labelStyle={styles.actionLabel}
            >
              Skip
            </Button>
            <Button
              mode="contained"
              onPress={onViewProfile}
              icon="account"
              style={styles.profileBtn}
              labelStyle={styles.actionLabel}
            >
              Profile
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                translateX.value = withSpring(SCREEN_WIDTH * 1.2, SPRING_CONFIG, () => {
                  runOnJS(triggerInvite)();
                });
              }}
              icon="send"
              style={styles.inviteBtn}
              labelStyle={styles.actionLabel}
            >
              Invite
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const CARD_HEIGHT = 480;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: CARD_HEIGHT,
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
    marginHorizontal: 16,
  },
  cardWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  card: {
    height: CARD_HEIGHT,
    paddingBottom: 80,
  },
  actions: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  skipBtn: {
    borderColor: '#94A3B8',
  },
  profileBtn: {
    backgroundColor: '#64748B',
  },
  inviteBtn: {
    backgroundColor: '#22C55E',
  },
  actionLabel: {
    fontSize: 13,
  },
});
