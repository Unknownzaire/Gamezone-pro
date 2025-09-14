
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { mockUsers, mockTransactions, mockTournaments } from '@/lib/mock-data';
import { User, Transaction, Tournament } from '@/lib/types';

// Let's create a very simple global state for our user
// In a real app, you'd use a more robust state management library or React Context with more features

interface UserContextType {
  user: User | null;
  transactions: Transaction[];
  tournaments: Tournament[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateBalance: (newBalance: number) => void;
  joinTournament: (tournamentId: string, user: User) => void;
  login: (isNewUser?: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Let's create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);

  const login = (isNewUser = false) => {
    if (isNewUser) {
      // For a new user, create a fresh state
      const newUser: User = {
        ...mockUsers[0], // Use a base template, but customize
        username: 'NewPlayer',
        email: 'newplayer@example.com',
        walletBalance: 100, // Start with a default balance
        avatarUrl: 'https://picsum.photos/seed/newuser/100/100',
      };
      setUser(newUser);
      setTransactions([]); // No initial transactions
    } else {
      // For an existing user, load their data
      const currentUser = { ...mockUsers[0] };
      const userTransactions = mockTransactions.filter(tx => tx.userId === currentUser.id);

      const balance = userTransactions.reduce((acc, tx) => {
          if (tx.type === 'credit') return acc + tx.amount;
          if (tx.type === 'debit') return acc - tx.amount;
          return acc;
      }, 0);


      setUser({ ...currentUser, walletBalance: balance });
      setTransactions(userTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };


  useEffect(() => {
    // By default, log in as an existing user.
    // A specific action (like completing signup) will call login(true)
    if (!user) {
        login();
    }
  }, [user]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      userId: user.id,
      createdAt: new Date(),
    };
    setTransactions(prev => [newTx, ...prev]);
    
    if (user && newTx.type === 'debit') {
      const newBalance = user.walletBalance - tx.amount;
      setUser({ ...user, walletBalance: newBalance });
    }
  };
  
  const updateBalance = (newBalance: number) => {
    if(user) {
        setUser({...user, walletBalance: newBalance});
    }
  }

  const joinTournament = (tournamentId: string, userToJoin: User) => {
    setTournaments(prevTournaments => 
      prevTournaments.map(t => {
        if (t.id === tournamentId) {
          // Check if user is already a participant
          if (t.participants.some(p => p.user.id === userToJoin.id)) {
            return t; // User already joined, return tournament as is
          }
          const newParticipant = {
            id: `p-${t.id}-${userToJoin.id}`,
            user: userToJoin,
            tournamentId: t.id,
            result: null,
            joinedAt: new Date(),
          };
          return { ...t, participants: [...t.participants, newParticipant] };
        }
        return t;
      })
    );
  };

  return (
    <UserContext.Provider value={{ user, transactions, tournaments, addTransaction, updateBalance, joinTournament, login }}>
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
