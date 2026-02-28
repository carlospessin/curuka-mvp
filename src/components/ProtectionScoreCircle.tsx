import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ProtectionScoreCircleProps {
  score: number;
  size?: number;
}

export function ProtectionScoreCircle({ score, size = 100 }: ProtectionScoreCircleProps) {
  const getScoreColor = () => {
    if (score >= 90) return colors.status.protected;
    if (score >= 70) return colors.status.partial;
    return colors.status.warning;
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Proteção Alta';
    if (score >= 70) return 'Proteção Parcial';
    return 'Atenção Necessária';
  };

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.circleContainer}>
        <View
          style={[
            styles.backgroundCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: getScoreColor(),
              borderTopColor: getScoreColor(),
              borderRightColor: getScoreColor(),
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color: getScoreColor() }]}>{score}%</Text>
        <Text style={styles.scoreLabel}>{getScoreLabel()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'absolute',
  },
  backgroundCircle: {
    borderColor: colors.neutral.border,
  },
  progressCircle: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.neutral.text.secondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
