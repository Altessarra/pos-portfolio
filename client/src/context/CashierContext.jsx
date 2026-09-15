import { createContext, useContext, useMemo, useState } from 'react';

export const DEFAULT_CASHIER_NAME = 'Portfolio Demo';
export const CASHIER_STORAGE_KEY = 'brim-pos-cashier-name';

const CashierContext = createContext(null);

function readStoredCashier() {
  try {
    const storedName = window.localStorage.getItem(CASHIER_STORAGE_KEY);
    return storedName?.trim() || DEFAULT_CASHIER_NAME;
  } catch {
    return DEFAULT_CASHIER_NAME;
  }
}

export function CashierProvider({ children }) {
  const [cashierName, setCashierName] = useState(readStoredCashier);

  const updateCashierName = (nextName) => {
    const trimmedName = String(nextName || '').trim();
    const safeName = trimmedName || DEFAULT_CASHIER_NAME;

    setCashierName(safeName);
    try {
      window.localStorage.setItem(CASHIER_STORAGE_KEY, safeName);
    } catch {
      // Keep the current name usable when storage is unavailable.
    }
  };

  const value = useMemo(() => ({ cashierName, updateCashierName }), [cashierName]);

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
}

export function useCashier() {
  const context = useContext(CashierContext);
  if (!context) throw new Error('useCashier must be used within CashierProvider');
  return context;
}
