import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing } from '../theme/colors';

export function Footer() {
    const openGithub = () => {
        Linking.openURL('https://github.com/carlospessin');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.brand}>Curuka</Text>

            <Text style={styles.rights}>
                2026 - Todos os direitos reservados
            </Text>

            <TouchableOpacity onPress={openGithub}>
                <Text style={styles.dev}>Desenvolvido por PX3</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.xl,
        alignItems: 'center',
        paddingBottom: spacing.xxs,
    },
    brand: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary[700],
        marginBottom: 4,
    },
    rights: {
        fontSize: 12,
        color: colors.neutral.text.muted,
    },
    dev: {
        fontSize: 10,
        color: colors.primary[600],
        marginTop: 4,
        fontWeight: '600',
    },
});