/**
 * Privacy Policy screen
 */

import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen({ navigation }: Props): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: May 15, 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect the following information when you use Stridely:{'\n\n'}
          <Text style={styles.bold}>Account Information:</Text> Name, email address, phone number, profile photo, and sports preferences.{'\n\n'}
          <Text style={styles.bold}>Location Data:</Text> With your permission, we collect your device's geographic location to match you with nearby athletes and display relevant events.{'\n\n'}
          <Text style={styles.bold}>Usage Data:</Text> Information about how you interact with the App, including features used, pages visited, and time spent.{'\n\n'}
          <Text style={styles.bold}>Communications:</Text> Messages sent through the App's chat feature are stored to provide the messaging service.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use your information to:{'\n'}
          • Provide and maintain the App{'\n'}
          • Match you with compatible training partners{'\n'}
          • Display relevant sports events near you{'\n'}
          • Enable communication between users{'\n'}
          • Provide AI coaching features{'\n'}
          • Improve and personalize your experience{'\n'}
          • Send important notifications about your account
        </Text>

        <Text style={styles.sectionTitle}>3. Data Storage & Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using Google Firebase infrastructure, which complies with international security standards including SOC 1, SOC 2, SOC 3, and ISO 27001. We implement industry-standard encryption for data in transit (TLS/SSL) and at rest.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information. We share your data only:{'\n'}
          • With other Stridely users as part of the matching and social features (profile information, sport preferences){'\n'}
          • With Firebase/Google Cloud for infrastructure services{'\n'}
          • With Google's Gemini AI for the AI coaching feature (anonymized conversation data only){'\n'}
          • When required by law or legal process
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.body}>
          In compliance with the Digital Personal Data Protection Act, 2023 (India) and GDPR (where applicable), you have the right to:{'\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Delete your account and associated data{'\n'}
          • Withdraw consent for data processing{'\n'}
          • Port your data to another service{'\n'}
          • Object to automated decision-making
        </Text>

        <Text style={styles.sectionTitle}>6. Data Retention</Text>
        <Text style={styles.body}>
          We retain your data for as long as your account is active. Upon account deletion, we will remove your personal data within 30 days, except where retention is required by law.
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.body}>
          Stridely is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
        <Text style={styles.body}>
          The App uses the following third-party services:{'\n'}
          • Firebase Authentication (account management){'\n'}
          • Cloud Firestore (data storage){'\n'}
          • Google Gemini AI (AI coaching){'\n'}
          • Expo (app delivery){'\n\n'}
          Each service has its own privacy policy governing the use of your data.
        </Text>

        <Text style={styles.sectionTitle}>9. Cookies & Local Storage</Text>
        <Text style={styles.body}>
          The App uses local storage (AsyncStorage) to maintain your authentication session and app preferences. This data is stored only on your device.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes through the App or via email. Your continued use of the App constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>11. Data Protection Officer</Text>
        <Text style={styles.body}>
          For any privacy-related inquiries or to exercise your data rights, contact our Data Protection Officer at privacy@stridely.app
        </Text>

        <Text style={styles.sectionTitle}>12. Grievance Redressal</Text>
        <Text style={styles.body}>
          In accordance with Indian IT law, complaints regarding data handling can be directed to our Grievance Officer at grievance@stridely.app. We will acknowledge your complaint within 24 hours and resolve it within 30 days.
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
  bold: { fontWeight: '700', color: colors.text },
  bottomSpacer: { height: spacing['4xl'] },
});
