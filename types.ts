export enum ScreenState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface TranscriptItem {
  id: string;
  text: string;
  type: 'text' | 'task' | 'agenda';
  meta?: string;
}

export interface Task {
  id: string;
  title: string;
  time?: string;
  tag?: string;
  tagColor?: string;
  completed: boolean;
  type: 'work' | 'personal' | 'urgent';
  source?: 'ai' | 'manual';
}

export interface AgendaItem {
  id: string;
  time: string; // Display string (e.g., "10:00", "10/24")
  fullIsoDate: string; // ISO string for sorting and editing (e.g., "2024-10-24T10:00")
  title: string;
  description: string;
  status: 'past' | 'current' | 'future';
  location?: string;
}

export interface DeploymentConfig {
  rk3576Id: string;
  cloudProvider: 'alibaba' | 'aws' | 'azure';
  alibabaRegion: string;
  iotPort: number;
  serverIp: string;
  status: 'disconnected' | 'connecting' | 'connected';
}