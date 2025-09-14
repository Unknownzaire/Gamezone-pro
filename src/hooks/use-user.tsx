
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { mockUsers, mockTransactions } from '@/lib/mock-data';
import { User, Transaction } from '@/lib/types';

// Let's create a very simple global state for our user
// In a real app, you'd use a more robust state management library or React Context with more features

interface UserContextType {
  user: User | null;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateBalance: (newBalance: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Let's create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch the current user from an API
    // For now, we'll just use the first mock user
    const currentUser = { ...mockUsers[0] };
    const userTransactions = mockTransactions.filter(tx => tx.userId === currentUser.id);

    const balance = userTransactions.reduce((acc, tx) => {
        if (tx.type === 'credit') return acc + tx.amount;
        if (tx.type === 'debit') return acc - tx.amount;
        return acc;
    }, 0);


    setUser({ ...currentUser, walletBalance: balance });
    setTransactions(userTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      userId: user.id,
      createdAt: new Date(),
    };
    setTransactions(prev => [newTx, ...prev]);
    if (user) {
      const newBalance = tx.type === 'credit' ? user.walletBalance + tx.amount : user.walletBalance - tx.amount;
      setUser({ ...user, walletBalance: newBalance });
    }
  };
  
  const updateBalance = (newBalance: number) => {
    if(user) {
        setUser({...user, walletBalance: newBalance});
    }
  }

  return (
    <UserContext.Provider value={{ user, transactions, addTransaction, updateBalance }}>
      {children}
    </UserContext.Provider>
  );
};

// And a custom hook to consume it
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
