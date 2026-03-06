import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/colors";

export function TermsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.neutral.text.primary} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Termos e Privacidade
                </Text>

            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.title}>Termos de Uso e Política de Privacidade</Text>

                <Text style={styles.sectionTitle}>1. Aceitação dos termos</Text>
                <Text style={styles.text}>
                    Ao utilizar o aplicativo Curuka, você concorda com estes Termos de Uso
                    e com a Política de Privacidade aqui descrita.
                </Text>

                <Text style={styles.sectionTitle}>2. Descrição do serviço</Text>
                <Text style={styles.text}>
                    O Curuka é um aplicativo de segurança infantil que permite registrar
                    eventos de leitura de etiquetas NFC associadas a perfis de crianças.
                    Essas leituras podem gerar notificações para os responsáveis.
                </Text>

                <Text style={styles.sectionTitle}>3. Informações coletadas</Text>
                <Text style={styles.text}>
                    O aplicativo pode coletar as seguintes informações:
                </Text>

                <Text style={styles.list}>• Nome e informações do responsável</Text>
                <Text style={styles.list}>• Informações básicas da criança cadastrada</Text>
                <Text style={styles.list}>• Registros de eventos de leitura NFC</Text>
                <Text style={styles.list}>• Localização aproximada no momento do evento</Text>

                <Text style={styles.sectionTitle}>4. Uso das informações</Text>
                <Text style={styles.text}>
                    As informações são utilizadas exclusivamente para:
                </Text>

                <Text style={styles.list}>• Identificação da criança</Text>
                <Text style={styles.list}>• Registro de eventos de segurança</Text>
                <Text style={styles.list}>• Envio de notificações aos responsáveis</Text>
                <Text style={styles.list}>• Melhoria da funcionalidade do aplicativo</Text>

                <Text style={styles.sectionTitle}>5. Compartilhamento de dados</Text>
                <Text style={styles.text}>
                    O Curuka não vende nem compartilha dados pessoais com terceiros,
                    exceto quando necessário para o funcionamento do serviço
                    (ex.: serviços de infraestrutura como Firebase).
                </Text>

                <Text style={styles.sectionTitle}>6. Segurança</Text>
                <Text style={styles.text}>
                    Empregamos medidas técnicas e organizacionais para proteger os dados
                    armazenados contra acesso não autorizado, alteração ou destruição.
                </Text>

                <Text style={styles.sectionTitle}>7. Responsabilidades</Text>
                <Text style={styles.text}>
                    O usuário é responsável pela veracidade das informações
                    cadastradas e pelo uso adequado do aplicativo.
                </Text>

                <Text style={styles.sectionTitle}>8. Alterações</Text>
                <Text style={styles.text}>
                    Estes termos podem ser atualizados periodicamente. A continuação do
                    uso do aplicativo após alterações implica aceitação dos novos termos.
                </Text>

                <Text style={styles.sectionTitle}>9. Contato</Text>
                <Text style={styles.text}>
                    Para dúvidas ou solicitações relacionadas à privacidade, entre em
                    contato com os responsáveis pelo aplicativo.
                </Text>

                <View style={{ height: 40 }} />

                <Text style={styles.footer}>
                    © Curuka — Todos os direitos reservados.
                </Text>

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.neutral.background,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderColor: colors.neutral.border,
    },

    backButton: {
        marginRight: spacing.sm
    },

    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.neutral.text.primary
    },

    content: {
        padding: spacing.md,
    },

    title: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: spacing.md,
        color: colors.primary[700],
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginTop: spacing.md,
        marginBottom: 6,
        color: colors.neutral.text.primary,
    },

    text: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.neutral.text.secondary,
    },

    list: {
        fontSize: 14,
        marginLeft: 10,
        marginTop: 4,
        color: colors.neutral.text.secondary,
    },

    footer: {
        textAlign: "center",
        fontSize: 12,
        color: colors.neutral.text.muted,
    },

});