
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { mockUsers, mockTransactions, mockTournaments } from '@/lib/mock-data';
import { User, Transaction, Tournament } from '@/lib/types';

// Let's create a very simple global state for our user
// In a real app, you'd use a more robust state management library or React Context with more features

interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  transactions: Transaction[];
  tournaments: Tournament[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateBalance: (newBalance: number) => void;
  joinTournament: (tournamentId: string, user: User) => void;
  login: (email: string, password: string) => boolean | 'blocked';
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked'>) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Let's create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
        const storedUsers = localStorage.getItem('allUsers');
        if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers));
        } else {
        setAllUsers(mockUsers);
        localStorage.setItem('allUsers', JSON.stringify(mockUsers));
        }
        
        const storedTransactions = localStorage.getItem('allTransactions');
        if (storedTransactions) {
        setAllTransactions(JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)})));
        } else {
        setAllTransactions(mockTransactions);
        localStorage.setItem('allTransactions', JSON.stringify(mockTransactions));
        }
    } catch(e) {
        console.error("Error loading data from localStorage", e);
        setAllUsers(mockUsers);
        setAllTransactions(mockTransactions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (allUsers.length > 0) {
        localStorage.setItem('allUsers', JSON.stringify(allUsers));
      }
    }
  }, [allUsers, loading]);

  useEffect(() => {
    if (!loading) {
      if (allTransactions.length > 0) {
        localStorage.setItem('allTransactions', JSON.stringify(allTransactions));
      }
    }
  }, [allTransactions, loading]);

  const login = (email: string, password: string): boolean | 'blocked' => {
    const userToLogin = allUsers.find(u => u.email === email);
    
    if (!userToLogin) {
      return false; 
    }

    if (userToLogin.isBlocked) {
        return 'blocked';
    }
    
    // For demo, we are not checking password. In a real app, you'd check a hashed password.

    const currentUser = { ...userToLogin };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    loadUserContext(currentUser.id);
    return true;
  };
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked'>) => {
    const newUser: User = {
        ...userDetails,
        id: `user-${Date.now()}`,
        walletBalance: 0,
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
        isBlocked: false,
    };
    
    setAllUsers(prevUsers => [...prevUsers, newUser]);
    
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    setUser(newUser);
    setTransactions([]);
  };

  const logout = () => {
    sessionStorage.removeItem('currentUser');
    setUser(null);
    setTransactions([]);
  }

  const loadUserContext = (userId: string) => {
    const liveUserData = allUsers.find(u => u.id === userId);

    if (liveUserData) {
        if (liveUserData.isBlocked) {
            logout();
            return;
        }

        const userTransactions = allTransactions.filter(tx => tx.userId === liveUserData.id);
        const completedBalance = userTransactions.reduce((acc, tx) => {
            if(tx.status !== 'completed') return acc;
            if (tx.type === 'credit') return acc + tx.amount;
            if (tx.type === 'debit') return acc - tx.amount;
            return acc;
        }, 0);

        const pendingDebits = userTransactions
            .filter(tx => tx.status === 'pending' && tx.type === 'debit')
            .reduce((acc, tx) => acc + tx.amount, 0);
        
        const finalBalance = completedBalance - pendingDebits;

        setUser({ ...liveUserData, walletBalance: finalBalance });
        setTransactions(userTransactions);
    } else {
        logout();
    }
  }


  useEffect(() => {
    if (loading) return;
    try {
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            const loggedInUser: User = JSON.parse(storedUser);
            loadUserContext(loggedInUser.id);
        }
    } catch(e) {
        console.error("Error loading user from sessionStorage", e);
        logout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, allTransactions, loading]);

  useEffect(() => {
    if (user) {
        const liveUserData = allUsers.find(u => u.id === user.id);
        const dataToStore = liveUserData || user;
        sessionStorage.setItem('currentUser', JSON.stringify(dataToStore));
    }
  }, [user, allUsers]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      userId: user.id,
      createdAt: new Date(),
    };
    setAllTransactions(prev => [newTx, ...prev]);
    
    // Also update the local transactions for the current user
    setTransactions(prev => [newTx, ...prev]);
    
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
          if (t.participants.some(p => p.user.id === userToJoin.id)) {
            return t; 
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
    <UserContext.Provider value={{ user, setUser, transactions, tournaments, addTransaction, updateBalance, joinTournament, login, signup, logout }}>
      {!loading && children}
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

    
    