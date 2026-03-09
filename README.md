# Curuka

Aplicativo mobile para **segurança infantil com tecnologia NFC**.\
O sistema permite identificar rapidamente uma criança e notificar os
responsáveis quando uma tag NFC é escaneada.

------------------------------------------------------------------------

## Funcionalidades

-   **Autenticação de usuários**
    -   Login com email e senha
    -   Login com Google
-   **Cadastro de criança**
    -   Criação de perfil da criança
    -   Perfil público acessível via URL/NFC
-   **Identificação por NFC**
    -   Cada criança possui uma tag NFC associada
    -   Ao escanear a tag, o sistema registra um evento
-   **Registro de eventos**
    -   Eventos são gravados no Firestore em `childEvents`
    -   Histórico completo disponível no aplicativo
-   **Histórico de leituras**
    -   Lista de todas as leituras NFC realizadas
    -   Visualização dentro do app
-   **Notificações Push**
    -   Responsáveis recebem notificação quando um NFC é escaneado
    -   Funciona mesmo com o aplicativo fechado
-   **Deep Linking**
    -   Perfis de crianças podem ser acessados diretamente por URL

------------------------------------------------------------------------

## Arquitetura

Tecnologias utilizadas:

-   Expo / React Native
-   Firebase Authentication
-   Firestore
-   Firebase Cloud Functions
-   Expo Push Notifications
-   NFC Manager

Fluxo de funcionamento:

Leitura NFC\
↓\
Criação de documento em childEvents\
↓\
Cloud Function é acionada\
↓\
Envio de notificação push\
↓\
Responsável recebe alerta no celular

------------------------------------------------------------------------

## Notificações Push

As notificações são enviadas através de **Firebase Cloud Functions**.

Quando um documento é criado em `childEvents`, uma função backend envia
uma notificação para o responsável.

### Requisitos

Para que as Cloud Functions funcionem é necessário **mudar o projeto
Firebase para o plano Blaze (pay-as-you-go)**.

O plano Blaze possui **free tier generoso**, então normalmente não gera
custos para projetos pequenos.

------------------------------------------------------------------------

## Deploy das Cloud Functions

Após configurar o Firebase e o plano Blaze, execute:

cd functions\
firebase deploy --only functions

Isso irá publicar a função responsável por enviar as notificações push.

------------------------------------------------------------------------

## Estrutura principal do Firestore

children\
childEvents\
settings\
pushTokens

## Executar

rodar em dispositivo físico:
```
adb kill-server
adb reverse tcp:8081 tcp:8081
npx expo run:android (para instalar o apk)
npx expo start --dev-client
```

------------------------------------------------------------------------

## Direitos

© Curuka --- Todos os direitos reservados.
