import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserState, PlanType, Child, ScanActivity, ProtectionScore, PLAN_LIMITS } from '../types';
import { getAuth } from 'firebase/auth';
import { watchChildrenList, watchUserSettings, saveUserSettings } from '../services/pessoa-service.js';

interface AppContextType {
  state: UserState;
  setPlan: (plan: PlanType) => void;
  updateProtectionScore: () => void;
  toggleEmergencyMode: () => void;
  emergencyMode: boolean;
  setUserSettings: (settings: Partial<Pick<UserState, 'notificationsEnabled' | 'smsAlertsEnabled'>>) => void;
}

// start with an empty list by default; sample data was causing the UI to
// display a pre-filled child profile when no real record existed.
// The dashboard component handles showing placeholders when no profile is
// available.
const initialChildren: Child[] = [];  // no children initially


const recentScans: ScanActivity[] = [
  {
    id: '1',
    childId: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    location: 'Escola Municipal João Paulo',
    type: 'normal'
  },
  {
    id: '2',
    childId: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    location: 'Shopping Center Norte',
    type: 'normal'
  },
  {
    id: '3',
    childId: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    location: 'Parque Ibirapuera',
    type: 'unusual'
  }
];

const initialProtectionScore: ProtectionScore = {
  score: 72,
  factors: [
    { name: 'Tag Ativa', value: 1, max: 1 },
    { name: 'Responsáveis', value: 1, max: 5, locked: true },
    { name: 'Histórico', value: 24, max: 168, locked: true },
    { name: 'Alertas', value: 0, max: 1, locked: true },
    { name: 'Modo Emergência', value: 0, max: 1, locked: true }
  ]
};

const initialState: UserState = {
  plan: 'free',
  children: initialChildren,
  recentScans,
  protectionScore: initialProtectionScore,
  guardians: 1,
  maxGuardians: 1,
  notificationsEnabled: true,
  smsAlertsEnabled: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(initialState);

  // keep local children in sync with Firestore. we need to handle the
  // case where Auth may not have finished initializing when this hook
  // first runs, so we listen for auth state changes and start/stop the
  // Firestore watcher accordingly.
  useEffect(() => {
    const auth = getAuth();
    let unsubChildren: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // stop previous watcher when user changes
      if (unsubChildren) {
        unsubChildren();
        unsubChildren = undefined;
      }

      if (!user?.uid) {
        // no user; clear children list
        setState((prev) => ({ ...prev, children: [] }));
        return;
      }

      unsubChildren = watchChildrenList(
        user.uid,
        (profiles: Child[]) => {
          setState((prev) => ({ ...prev, children: profiles }));
        },
        (err: unknown) => {
          console.error('error watching children list', err);
        }
      );

      // start settings watcher as well
      const unsubSettings = watchUserSettings(
        user.uid,
        (settings: Partial<import('../types').UserState> | null) => {
          if (settings) {
            // merge preferences and optionally load a saved plan
            setState((prev) => {
              const planFromDb: PlanType = settings.plan ?? prev.plan;
              const limits = PLAN_LIMITS[planFromDb];
              // if plan changed we also need to recalc protection score
              if (planFromDb !== prev.plan) {
                updateProtectionScoreForPlan(planFromDb);
              }
              return {
                ...prev,
                notificationsEnabled: settings.notificationsEnabled ?? prev.notificationsEnabled,
                smsAlertsEnabled: settings.smsAlertsEnabled ?? prev.smsAlertsEnabled,
                plan: planFromDb,
                maxGuardians: limits.guardians,
              };
            });
          }
        },
        (err: unknown) => {
          console.error('error watching user settings', err);
        }
      );
      // ensure we cleanup when auth state changes again
      if (unsubChildren) {
        const origUnsub = unsubChildren;
        unsubChildren = () => {
          origUnsub();
          unsubSettings();
        };
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubChildren) unsubChildren();
    };
  }, []);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const setUserSettings = (settings: Partial<Pick<UserState, 'notificationsEnabled' | 'smsAlertsEnabled'>>) => {
    setState(prev => ({ ...prev, ...settings }));
  };

  const setPlan = async (plan: PlanType) => {
    const limits = PLAN_LIMITS[plan];
    setState(prev => ({
      ...prev,
      plan,
      maxGuardians: limits.guardians
    }));
    updateProtectionScoreForPlan(plan);

    // persist plan in user settings document as well
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user?.uid) {
        await saveUserSettings(user.uid, { plan });
      }
    } catch (err) {
      console.error('failed to persist plan change', err);
    }
  };

  const updateProtectionScoreForPlan = (plan: PlanType) => {
    let score = 72;
    if (plan === 'plus') score = 85;
    if (plan === 'premium') score = 98;

    const factors = [
      { name: 'Tag Ativa', value: 1, max: 1 },
      { name: 'Responsáveis', value: plan === 'free' ? 1 : plan === 'plus' ? 5 : 10, max: 10 },
      { name: 'Histórico', value: plan === 'free' ? 24 : 168, max: 168, locked: plan === 'free' },
      { name: 'Alertas Inteligentes', value: plan === 'premium' ? 1 : 0, max: 1, locked: plan !== 'premium' },
      { name: 'Modo Emergência', value: plan === 'premium' ? 1 : 0, max: 1, locked: plan !== 'premium' }
    ];

    setState(prev => ({
      ...prev,
      protectionScore: { score, factors }
    }));
  };

  const updateProtectionScore = () => {
    updateProtectionScoreForPlan(state.plan);
  };

  const toggleEmergencyMode = () => {
    setEmergencyMode(prev => !prev);
  };

  return (
    <AppContext.Provider value={{ state, setPlan, updateProtectionScore, toggleEmergencyMode, emergencyMode, setUserSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
