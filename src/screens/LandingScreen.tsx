import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from '../theme/colors';


export function LandingScreen({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const openApp = () => navigation.navigate("Login");

  const downloadAPK = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/apk/curuka-1.0.0.apk";
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ───── NAVBAR ───── */}
      <View style={[styles.navbar, isMobile && styles.navbarMobile]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="shield-checkmark" size={16} color={colors.neutral.white} />
          </View>
          <Text style={styles.logoText}>curuka</Text>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity style={styles.loginBtn} onPress={openApp}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadNavBtn} onPress={downloadAPK}>
            <Ionicons name="download-outline" size={14} color={colors.neutral.white} />
            <Text style={styles.downloadNavText}>Baixar APK</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ───── HERO ───── */}
      <View style={[styles.hero, isMobile ? styles.heroMobile : styles.heroDesktop]}>
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Tecnologia NFC</Text>
          </View>

          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Proteção{"\n"}
            <Text style={styles.heroTitleAccent}>invisível.</Text>
            {"\n"}Segurança{"\n"}<Text style={styles.heroTitleAccent}>real.</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Curuka usa tecnologia NFC integrada em roupas e acessórios para
            identificar crianças e notificar os responsáveis instantaneamente.
          </Text>

          <View style={styles.heroCtas}>
            <TouchableOpacity style={styles.primaryCta} onPress={downloadAPK}>
              <Ionicons name="logo-android" size={18} color={colors.neutral.white} />
              <Text style={styles.primaryCtaText}>Baixar para Android</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryCta} />
          </View>

          <View style={styles.trustRow}>
            {["🔒 Dados criptografados", "⚡ Alertas instantâneos"].map((item, i) => (
              <Text key={i} style={styles.trustItem}>{item}</Text>
            ))}
          </View>
        </View>

        {!isMobile && (
          <View style={styles.mockupWrap}>
            <View style={styles.mockupGlow} />
            <Image
              source={{ uri: "/images/mockup.png" }}
              style={styles.mockupImg}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* ───── COMO FUNCIONA ───── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>COMO FUNCIONA</Text>
          <Text style={styles.sectionTitle}>Três passos.{"\n"}Proteção total.</Text>
        </View>

        <View style={[styles.steps, !isMobile && styles.stepsRow]}>
          {[
            {
              num: "01",
              icon: "🏷️",
              title: "Adquira uma peça Curuka",
              text: "Roupas e acessórios já vêm com tag NFC integrada, pronta para ativar.",
            },
            {
              num: "02",
              icon: "📱",
              title: "Configure o perfil",
              text: "Crie o perfil do seu filho, adicione contatos e vincule a tag NFC em segundos.",
            },
            {
              num: "03",
              icon: "🔔",
              title: "Receba alertas",
              text: "Sempre que a tag for escaneada, você é notificado imediatamente, onde estiver.",
            },
          ].map((step, i) => (
            <View key={i} style={[styles.stepCard, !isMobile && styles.stepCardDesktop]}>
              <Text style={styles.stepNum}>{step.num}</Text>
              <Text style={styles.stepEmoji}>{step.icon}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ───── CTA FINAL ───── */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaCard}>
          <View style={styles.ctaGlowLeft} />
          <View style={styles.ctaGlowRight} />

          <Text style={styles.ctaEyebrow}>DISPONÍVEL AGORA</Text>
          <Text style={styles.ctaTitle}>
            Comece a proteger{"\n"}sua família hoje
          </Text>

          <TouchableOpacity style={styles.ctaBtn} onPress={downloadAPK}>
            <Ionicons name="logo-android" size={22} color={colors.neutral.white} />
            <Text style={styles.ctaBtnText}>Curuka APP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ───── FOOTER ───── */}
      <View style={styles.footer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="shield-checkmark" size={14} color={colors.neutral.white} />
          </View>
          <Text style={styles.logoText}>curuka</Text>
        </View>
        <Text style={styles.footerText}>
          © 2026 Curuka. Todos os direitos reservados.
        </Text>
        <Text style={styles.footerText}>
          Desenvolvido por{" "}
          <a href="https://github.com/carlospessin" style={{ textDecoration: "none" }}>
            <Text style={styles.heroTitleAccent}>PX3</Text>
          </a>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf7f6',
  },

  /* ── Navbar ── */
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: 18,
    backgroundColor: colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  navbarMobile: {
    paddingHorizontal: spacing.md,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoIconWrap: {
    backgroundColor: colors.primary[500],
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.neutral.text.primary,
    letterSpacing: -0.5,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
  },
  loginBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  loginBtnText: {
    fontWeight: "600",
    color: colors.neutral.text.primary,
    fontSize: 14,
  },
  downloadNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  downloadNavText: {
    color: colors.neutral.white,
    fontWeight: "700",
    fontSize: 14,
  },

  /* ── Hero ── */
  hero: {
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: spacing.xl,
  },
  heroMobile: {
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
  },
  heroDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
  },
  heroContent: {
    flex: 1,
    maxWidth: 520,
  },
  heroContentMobile: {
    maxWidth: "100%",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  badgeText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: "800",
    color: colors.neutral.text.primary,
    lineHeight: 58,
    letterSpacing: -2,
    marginBottom: spacing.md,
  },
  heroTitleMobile: {
    fontSize: 38,
    lineHeight: 44,
  },
  heroTitleAccent: {
    color: colors.primary[500],
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.neutral.text.secondary,
    lineHeight: 26,
    marginBottom: spacing.xl + 4,
    maxWidth: 440,
  },
  heroCtas: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: "wrap",
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    ...shadows.large,
  },
  primaryCtaText: {
    color: colors.neutral.white,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryCtaText: {
    color: colors.primary[600],
    fontWeight: "600",
    fontSize: 15,
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 4,
  },
  trustItem: {
    fontSize: 12,
    color: colors.neutral.text.secondary,
    fontWeight: "500",
  },

  /* Mockup */
  mockupWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    maxWidth: 400,
  },
  mockupGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary[500],
    opacity: 0.08,
  },
  mockupImg: {
    width: 400,
    height: 600,
  },

  /* ── How it works ── */
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 72,
    backgroundColor: colors.neutral.card,
  },
  sectionHeader: {
    marginBottom: spacing.xxl,
    alignItems: "center",
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: colors.primary[500],
    marginBottom: spacing.sm + 4,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.neutral.text.primary,
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 44,
  },
  steps: {
    gap: spacing.md,
    maxWidth: 1000,
    alignSelf: "center",
    width: "100%",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  stepCard: {
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.xl,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  stepCardDesktop: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary[500],
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  stepEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs + 6,
    lineHeight: 24,
  },
  stepText: {
    fontSize: 14,
    color: colors.neutral.text.secondary,
    lineHeight: 22,
  },

  /* ── CTA Section ── */
  ctaSection: {
    padding: spacing.xl,
    backgroundColor: colors.neutral.background,
  },
  ctaCard: {
    backgroundColor: colors.primary[900],
    borderRadius: borderRadius.xl,
    paddingVertical: 64,
    paddingHorizontal: 40,
    alignItems: "center",
    overflow: "hidden",
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    position: "relative",
  },
  ctaGlowLeft: {
    position: "absolute",
    left: -80,
    top: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary[500],
    opacity: 0.15,
  },
  ctaGlowRight: {
    position: "absolute",
    right: -60,
    bottom: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary[500],
    opacity: 0.1,
  },
  ctaEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: colors.primary[200],
    marginBottom: spacing.md,
  },
  ctaTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.neutral.white,
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: spacing.sm + 4,
  },
  ctaSubtitle: {
    fontSize: 15,
    color: colors.primary[100],
    textAlign: "center",
    marginBottom: spacing.xl + 4,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 6,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 28,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.large,
  },
  ctaBtnText: {
    color: colors.neutral.white,
    fontWeight: "800",
    fontSize: 16,
  },

  /* ── Footer ── */
  footer: {
    paddingVertical: 28,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    backgroundColor: colors.neutral.card,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm + 4,
    display: "flex",
  },
  footerText: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
  },
  footerTextLink: {
    fontSize: 13,
    color: colors.neutral.text.secondary,
  },
});
