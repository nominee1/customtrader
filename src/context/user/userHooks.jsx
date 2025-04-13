import { useMemo } from 'react';
import { useUser } from './useUser';

export const useActiveAccountType = () => {
  const { activeAccount } = useUser();
  return useMemo(() => 
    activeAccount?.is_virtual ? 'demo' : 'real',
  [activeAccount]);
};

export const useAccountData = () => {
  const { activeAccount, accountData } = useUser();
  return useMemo(() => 
    activeAccount ? accountData[activeAccount.loginid] : {},
  [activeAccount, accountData]);
};

export const useBalance = () => {
  const { activeAccount, accountData } = useUser();
  return useMemo(() => 
    activeAccount ? accountData[activeAccount.loginid]?.balance : 0,
  [activeAccount, accountData]);
};

export const useRecentTrades = () => {
  const { activeAccount, accountData } = useUser();
  return useMemo(() => 
    activeAccount ? accountData[activeAccount.loginid]?.recentTrades || [] : [],
  [activeAccount, accountData]);
};