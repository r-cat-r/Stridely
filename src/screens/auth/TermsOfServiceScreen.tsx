/**
 * Terms of Service screen
 */

import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfService'>;

export function TermsOfServiceScreen({ navigation }: Props): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: May 15, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using Stridely ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.body}>
          Stridely is a social sports platform that connects athletes and sports enthusiasts for training, events, and activities. The App provides features including user profiles, sport-based matching, event creation, messaging, and AI-powered coaching.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.body}>
          You must create an account to use the App. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
        </Text>

        <Text style={styles.sectionTitle}>4. User Conduct</Text>
        <Text style={styles.body}>
          You agree not to:{'\n'}
          • Use the App for any unlawful purpose{'\n'}
          • Harass, abuse, or harm other users{'\n'}
          • Post false, misleading, or deceptive content{'\n'}
          • Impersonate any person or entity{'\n'}
          • Interfere with the App's operation{'\n'}
          • Use automated means to access the App{'\n'}
          • Share inappropriate or offensive content
        </Text>

        <Text style={styles.sectionTitle}>5. Content Ownership</Text>
        <Text style={styles.body}>
          You retain ownership of content you create. By posting content on Stridely, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content within the App for the purpose of providing our services.
        </Text>

        <Text style={styles.sectionTitle}>6. Privacy</Text>
        <Text style={styles.body}>
          Your use of the App is also governed by our Privacy Policy. By using the App, you consent to the collection and use of your information as described therein.
        </Text>

        <Text style={styles.sectionTitle}>7. Location Data</Text>
        <Text style={styles.body}>
          The App uses your location data to match you with nearby athletes and display relevant events. You may control location permissions through your device settings. Disabling location may limit App functionality.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.body}>
          Stridely is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the App, including but not limited to physical injuries during athletic activities, interactions with other users, or data loss.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.body}>
          We reserve the right to suspend or terminate your account at any time for violation of these terms. You may delete your account at any time through the App settings.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.body}>
          We may modify these terms at any time. Continued use of the App after changes constitutes acceptance of the modified terms. We will notify users of significant changes via the App or email.
        </Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.body}>
          These terms are governed by and construed in accordance with the laws of India, including the Information Technology Act, 2000, and the Consumer Protection Act, 2019. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact</Text>
        <Text style={styles.body}>
          For questions about these Terms, contact us at support@stridely.app
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.h2, color: colors.text },
  content: { paddingHorizontal: spacing['2xl'], paddingBottom: spacing['4xl'] },
  updated: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.h3, color: colors.text,
    marginTop: spacing.xl, marginBottom: spacing.md,
  },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  bottomSpacer: { height: spacing['4xl'] },
});
