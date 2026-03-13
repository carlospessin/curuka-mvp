import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { getAuth } from 'firebase/auth';
import { colors } from './src/theme/colors';
import { watchAuthState } from './src/services/auth-service';
import {
  Notifications,
  getNotificationHistoryTarget,
  syncPushTokenForUser,
} from './src/services/push-notifications';
import { flushPendingNavigation, navigationRef, navigateToHistory } from './src/navigation/navigationRef';
import { Platform } from "react-native";

import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ChildProfileScreen } from './src/screens/ChildProfileScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TermsScreen } from "./src/screens/TermsScreen";
import { LandingScreen } from './src/screens/LandingScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ExpoNotifications from "expo-notifications";


ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function StartupSplash() {
  return (
    <View style={styles.splashScreen}>
      <View style={styles.splashCircle}>
        <Image
          source={require('./assets/splash-icon.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </View>
      <Text>{process.env.EXPO_PUBLIC_VERSION}</Text>
    </View>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'shield' : 'shield-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Plans':
              iconName = focused ? 'diamond' : 'diamond-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          };

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral.text.muted,

        tabBarStyle: {
          backgroundColor: colors.neutral.card,
          borderTopColor: colors.neutral.border,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          height: 70 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Histórico' }} />
      <Tab.Screen name="Plans" component={PlansScreen} options={{ tabBarLabel: 'Planos' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Config' }} />
    </Tab.Navigator>
  );
}

function AppShell({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { state } = useApp();
  const linking = {
    prefixes: [
      'com.curuka.app://',
      'curuka://',
      'http://localhost:19006',
      'http://localhost:8081',
      process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://curuka-mvp.vercel.app',
    ],
    config: {
      screens: {
        Landing: '',
        Login: 'login',
        Main: {
          path: 'app',
          screens: {
            Dashboard: '',
            History: 'history',
            Plans: 'plans',
            Settings: 'settings',
          },
        },
        Terms: 'app/terms',
        Profile: 'app/profile',
        ChildProfile: 'c/:slug',
      },
    },
  };

  React.useEffect(() => {
    const authUserId = isAuthenticated ? getAuth().currentUser?.uid : null;

    if (!authUserId) return;
    syncPushTokenForUser(authUserId, true).catch((error) => {
      console.warn('push token sync failed on app shell', error);
    });

    // syncPushTokenForUser(authUserId || '', isAuthenticated && state.notificationsEnabled).catch((error) => {
    //   console.error('failed to sync push token', error);
    // });
  }, [isAuthenticated]);

  React.useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && getNotificationHistoryTarget(response.notification.request.content.data)) {
        navigateToHistory();
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      if (getNotificationHistoryTarget(notification.request.content.data)) {
        navigateToHistory();
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (getNotificationHistoryTarget(response.notification.request.content.data)) {
        navigateToHistory();
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);



  return (
    <NavigationContainer linking={linking} ref={navigationRef} onReady={flushPendingNavigation}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : Platform.OS === 'web' ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}

        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen
          name="ChildProfile"
          component={ChildProfileScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [minimumSplashElapsed, setMinimumSplashElapsed] = React.useState(false);
  const [showSplashOverlay, setShowSplashOverlay] = React.useState(true);
  const splashOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumSplashElapsed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const unsubscribe = watchAuthState((user: unknown) => {
      setIsAuthenticated(Boolean(user));
      setIsCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  const appReady = fontsLoaded && !isCheckingAuth && minimumSplashElapsed;

  React.useEffect(() => {
    if (!appReady || !showSplashOverlay) return;

    const animation = Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setShowSplashOverlay(false);
      }
    });

    return () => animation.stop();
  }, [appReady, showSplashOverlay, splashOpacity]);

  return (
    <View style={styles.appRoot}>
      {appReady ? (
        <AppProvider>
          <AppShell isAuthenticated={isAuthenticated} />
        </AppProvider>
      ) : (
        <View style={styles.appBackground} />
      )}
      {showSplashOverlay && (
        <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]}>
          <StartupSplash />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  appBackground: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  splashScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.background,
    paddingHorizontal: 24,
  },
  splashCircle: {
    width: 176,
    height: 176,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  splashTitle: {
    marginTop: 24,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    color: colors.primary[800],
    fontWeight: '800',
    maxWidth: 280,
  },
});
