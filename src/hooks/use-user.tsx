
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
  login: (email: string, password: string) => boolean;
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl'>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Let's create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      setAllUsers(mockUsers);
      localStorage.setItem('allUsers', JSON.stringify(mockUsers));
    }
  }, []);

  useEffect(() => {
    if (allUsers.length > 0) {
      localStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
  }, [allUsers]);


  const login = (email: string, password: string): boolean => {
    // NOTE: In a real app, password should be hashed and checked on the server.
    // This is a simplified example for demonstration purposes.
    const userToLogin = allUsers.find(u => u.email === email);
    
    if (!userToLogin) {
      return false; // User not found
    }
    
    // For demo, we are not checking password. In a real app, you'd check a hashed password.
    // if(userToLogin.password !== password) return false;

    const currentUser = { ...userToLogin };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    sessionStorage.removeItem('isNewUser');
    
    const userTransactions = mockTransactions.filter(tx => tx.userId === currentUser.id);

    const completedBalance = userTransactions.reduce((acc, tx) => {
      if(tx.status !== 'completed') return acc;
        if (tx.type === 'credit') return acc + tx.amount;
        if (tx.type === 'debit') return acc - tx.amount;
        return acc;
    }, 0);

    const pendingDebits = userTransactions
      .filter(tx => tx.status === 'pending' && tx.type === 'debit')
      .reduce((acc, tx) => acc + tx.amount, 0);

    setUser({ ...currentUser, walletBalance: completedBalance - pendingDebits });
    setTransactions(userTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return true;
  };
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl'>) => {
    const newUser: User = {
        ...userDetails,
        id: `user-${Date.now()}`,
        walletBalance: 0, // Initial balance
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
    };
    
    setAllUsers(prevUsers => [...prevUsers, newUser]);
    
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    sessionStorage.setItem('isNewUser', 'true');
    setUser(newUser);
    setTransactions([]);
  };


  useEffect(() => {
    // This is a simple way to persist user state across reloads.
    // In a real app, you'd use localStorage or a server-side session.
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        const loggedInUser = JSON.parse(storedUser);
        
        const isNewUser = sessionStorage.getItem('isNewUser') === 'true';

        const userTransactions = isNewUser ? [] : mockTransactions.filter(tx => tx.userId === loggedInUser.id);
        const completedBalance = userTransactions.reduce((acc, tx) => {
            if(tx.status !== 'completed') return acc;
            if (tx.type === 'credit') return acc + tx.amount;
            if (tx.type === 'debit') return acc - tx.amount;
            return acc;
        }, isNewUser ? loggedInUser.walletBalance : 0);

        const pendingDebits = userTransactions
            .filter(tx => tx.status === 'pending' && tx.type === 'debit')
            .reduce((acc, tx) => acc + tx.amount, 0);
        
        loggedInUser.walletBalance = completedBalance - pendingDebits;

        setUser(loggedInUser);
        setTransactions(userTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  }, [allUsers]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('isNewUser');
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
    
    // Only deduct from balance if it's a new pending withdrawal
    if (user && newTx.type === 'debit' && newTx.status === 'pending') {
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
    <UserContext.Provider value={{ user, transactions, tournaments, addTransaction, updateBalance, joinTournament, login, signup }}>
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
