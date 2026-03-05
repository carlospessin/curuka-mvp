export type PlanType = 'free' | 'plus' | 'premium';

export interface Child {
  id: string;
  name: string;
  age: number;
  photo: string | null;
  slug?: string; // unique identifier used in profile URLs
  tagStatus: 'active' | 'blocked' | 'inactive';
  guardians?: {
    name: string;
    phone: string;
    whatsapp: boolean;
    principal?: boolean;
  }[];
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    emergencyContact?: string;
    pcd?: boolean;
    healthPlans?: string;
    otherInfo?: string;
  };
}

export interface ScanActivity {
  id: string;
  childId: string;
  timestamp: Date;
  location: string;
  type: 'normal' | 'unusual' | 'alert';
  scannerId?: string;
}

export type NotificationType = 'scan' | 'location';

export interface AppNotification {
  id: string;
  type: NotificationType;
  ownerId?: string;
  childId?: string;
  childName: string;
  message: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  read: boolean;
}

export interface ProtectionScore {
  score: number;
  factors: {
    name: string;
    value: number;
    max: number;
    locked?: boolean;
  }[];
}

export interface UserState {
  plan: PlanType;
  children: Child[];
  recentScans: ScanActivity[];
  notifications: AppNotification[];
  protectionScore: ProtectionScore;
  guardians: number;
  maxGuardians: number;

  // persisted user preferences
  notificationsEnabled: boolean;
  smsAlertsEnabled: boolean;
}

export const PLAN_LIMITS = {
  free: {
    children: 1,
    guardians: 1,
    historyHours: 24,
    features: ['basic_notifications', 'last_scan', 'call_button']
  },
  plus: {
    children: 1,
    guardians: 5,
    historyHours: Infinity,
    features: ['full_history', 'map_view', 'remote_block', 'sms_limited', 'export_history']
  },
  premium: {
    children: Infinity,
    guardians: Infinity,
    historyHours: Infinity,
    features: ['unusual_alerts', 'dynamic_score', 'emergency_mode', 'monthly_report', 'sms_unlimited', 'encrypted_backup', 'temp_share', 'priority_notifications']
  }
};

export const PLAN_NAMES = {
  free: 'Free',
  plus: 'Plus',
  premium: 'Premium'
};

export const PLAN_PRICES = {
  free: 0,
  plus: 19.90,
  premium: 39.90
};
