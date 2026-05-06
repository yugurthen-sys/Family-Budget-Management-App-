/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually';

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  category: 'income' | 'fixed-expense' | 'occasional-expense';
  categoryId?: string;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export type Currency = 'USD' | 'EUR' | 'MAD';

export const CURRENCY_CONFIG: Record<Currency, { symbol: string, locale: string, rate: number }> = {
  USD: { symbol: '$', locale: 'en-US', rate: 1 },
  EUR: { symbol: '€', locale: 'de-DE', rate: 0.92 },
  MAD: { symbol: 'DH', locale: 'ar-MA', rate: 10.12 },
};

export function formatCurrency(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FREQUENCIES: { value: Frequency; label: string; monthlyMultiplier: number; annualMultiplier: number }[] = [
  { value: 'daily', label: 'Daily', monthlyMultiplier: 30, annualMultiplier: 365 },
  { value: 'weekly', label: 'Weekly', monthlyMultiplier: 4, annualMultiplier: 52 },
  { value: 'monthly', label: 'Monthly', monthlyMultiplier: 1, annualMultiplier: 12 },
  { value: 'quarterly', label: 'Quarterly', monthlyMultiplier: 1 / 3, annualMultiplier: 4 },
  { value: 'semi-annually', label: 'Semi-Annually', monthlyMultiplier: 1 / 6, annualMultiplier: 2 },
  { value: 'annually', label: 'Annually', monthlyMultiplier: 1 / 12, annualMultiplier: 1 },
];

export function getMonthlyEquivalent(amount: number, frequency: Frequency): number {
  const freq = FREQUENCIES.find(f => f.value === frequency);
  return amount * (freq ? freq.monthlyMultiplier : 1);
}

export function getAnnualEquivalent(amount: number, frequency: Frequency): number {
  const freq = FREQUENCIES.find(f => f.value === frequency);
  return amount * (freq ? freq.annualMultiplier : 12);
}
