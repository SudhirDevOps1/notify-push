export type PriorityLevel = 'min' | 'low' | 'default' | 'high' | 'urgent';

export interface ActionButton {
  action: 'view' | 'http' | 'broadcast';
  label: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
  clear?: boolean;
}

export interface SendOptions {
  title: string;
  message: string;
  priority?: PriorityLevel;
  tags?: string[];
  clickUrl?: string;
  actions?: ActionButton[];
  topic?: string;
  serverUrl?: string;
  token?: string;
  timeoutMs?: number;
  delay?: string;
}

export interface ClientConfig {
  serverUrl?: string;
  defaultTopic?: string;
  token?: string;
  timeoutMs?: number;
}

export interface DispatchResult {
  success: boolean;
  id?: string;
  error?: string;
  statusCode?: number;
}
