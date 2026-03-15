/**
 * Swipeable card stack - gesture-based discovery
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
  const handleInvite = useCallback(
    (match: DiscoveryMatch) => onInvite(match),
    [onInvite]
  );
  const handleSkip = useCallback(
    (match: DiscoveryMatch) => onSkip(match),
    [onSkip]
  );

  const visibleCards = matches.slice(0, 3);

  return (
    <View style={styles.container}>
      {visibleCards.map((match, index) => (
        <SwipeableCard
          key={match.user.id}
          match={match}
          index={index}
          totalVisible={visibleCards.length}
          onSwipeRight={() => handleInvite(match)}
          onSwipeLeft={() => handleSkip(match)}
          onViewProfile={() => onViewProfile(match)}
        />
      ))}
    </View>
  );
}

interface SwipeableCardProps {
  match: DiscoveryMatch;
  index: number;
  totalVisible: number;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onViewProfile: () => void;
}

function SwipeableCard({
  match,
  index,
  totalVisible,
  onSwipeRight,
  onSwipeLeft,
  onViewProfile,
}: SwipeableCardProps): React.JSX.Element {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1 - index * 0.05);
  const rotateZ = useSharedValue(0);

  const triggerInvite = useCallback(() => {
    onSwipeRight();
  }, [onSwipeRight]);

  const triggerSkip = useCallback(() => {
    onSwipeLeft();
  }, [onSwipeLeft]);

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
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            zIndex: totalVisible - index,
            top: index * 8,
          },
        ]}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <DiscoveryCard match={match} />
          <CardActions
            onInvite={() => {
              translateX.value = withSpring(SCREEN_WIDTH * 1.2, SPRING_CONFIG, () => {
                runOnJS(triggerInvite)();
              });
            }}
            onSkip={() => {
              translateX.value = withSpring(-SCREEN_WIDTH * 1.2, SPRING_CONFIG, () => {
                runOnJS(triggerSkip)();
              });
            }}
            onViewProfile={onViewProfile}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

interface CardActionsProps {
  onInvite: () => void;
  onSkip: () => void;
  onViewProfile: () => void;
}

function CardActions({ onInvite, onSkip, onViewProfile }: CardActionsProps): React.JSX.Element {
  return (
    <View style={styles.actions}>
      <Button
        mode="outlined"
        onPress={onSkip}
        icon="close"
        style={styles.skipBtn}
        labelStyle={styles.skipLabel}
      >
        Skip
      </Button>
      <Button
        mode="contained"
        onPress={onViewProfile}
        icon="account"
        style={styles.profileBtn}
        labelStyle={styles.profileLabel}
      >
        View Profile
      </Button>
      <Button
        mode="contained"
        onPress={onInvite}
        icon="send"
        style={styles.inviteBtn}
        labelStyle={styles.inviteLabel}
      >
        Invite
      </Button>
    </View>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipBtn: {
    borderColor: '#94A3B8',
  },
  skipLabel: {
    fontSize: 14,
  },
  profileBtn: {
    backgroundColor: '#64748B',
  },
  profileLabel: {
    fontSize: 14,
  },
  inviteBtn: {
    backgroundColor: '#22C55E',
  },
  inviteLabel: {
    fontSize: 14,
  },
});
