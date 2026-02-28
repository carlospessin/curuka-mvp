import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../theme/colors';
import { PlanType, PLAN_NAMES } from '../types';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'small' | 'medium' | 'large';
}

export function PlanBadge({ plan, size = 'medium' }: PlanBadgeProps) {
  const getPlanColor = () => {
    switch (plan) {
      case 'free':
        return colors.plan.free;
      case 'plus':
        return colors.plan.plus;
      case 'premium':
        return colors.plan.premium;
    }
  };

  const getBackgroundColor = () => {
    switch (plan) {
      case 'free':
        return colors.neutral.border;
      case 'plus':
        return colors.secondary[50];
      case 'premium':
        return '#FFF8E1';
    }
  };

  const getIcon = () => {
    switch (plan) {
      case 'free':
        return '○';
      case 'plus':
        return '◆';
      case 'premium':
        return '👑';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: 6, fontSize: 11, iconSize: 10 };
      case 'large':
        return { padding: 12, fontSize: 16, iconSize: 16 };
      default:
        return { padding: 8, fontSize: 13, iconSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          padding: sizeStyles.padding,
        },
      ]}
    >
      <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>{getIcon()}</Text>
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize, color: getPlanColor() }]}>
        {PLAN_NAMES[plan]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
