import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme/colors';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  rightElement?: ReactNode;
  onPress?: () => void;
  locked?: boolean;
  style?: any;
}

export function Card({ children, title, subtitle, rightElement, onPress, locked, style }: CardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.card, shadows.medium, locked && styles.lockedCard, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || rightElement) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {locked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>🔒 Disponível no plano Plus</Text>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lockedCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral.text.muted,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: spacing.sm,
  },
  content: {
    // Content styles
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.secondary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  lockedText: {
    fontSize: 11,
    color: colors.neutral.white,
    fontWeight: '500',
  },
});
