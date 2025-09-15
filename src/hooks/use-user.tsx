
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { mockUsers, mockTransactions, mockTournaments } from '@/lib/mock-data';
import { User, Transaction, Tournament } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from './use-toast';

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
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt'>) => void;
  logout: () => void;
  reload: () => void;
  toast: ReturnType<typeof useToast>['toast'];
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
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const loadInitialData = () => {
    try {
        const storedUsers = localStorage.getItem('allUsers');
        if (storedUsers) {
            setAllUsers(JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: new Date(u.createdAt) })));
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
  }

  useEffect(() => {
    loadInitialData();
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
    
    loadUserContext(userToLogin.id);
    return true;
  };
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt'>) => {
    const newUser: User = {
        ...userDetails,
        id: `user-${Date.now()}`,
        walletBalance: 0,
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
        isBlocked: false,
        createdAt: new Date(),
    };
    
    setAllUsers(prevUsers => [...prevUsers, newUser]);
    
    setUser(newUser);
    setTransactions([]);
  };

  const logout = () => {
    sessionStorage.removeItem('currentUser');
    setUser(null);
    setTransactions([]);
    if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/admin')) {
        router.push('/login');
    }
  }

  const loadUserContext = (userId: string) => {
    const liveUserData = allUsers.find(u => u.id === userId);

    if (liveUserData) {
        if (liveUserData.isBlocked) {
            logout();
            return;
        }

        const userTransactions = allTransactions.filter(tx => tx.userId === liveUserData.id);
        
        // Balance calculation should start from a base and apply transactions
        // For this demo, let's assume the walletBalance on the user object is the "true" balance from a DB
        // and we adjust it based on pending transactions for the UI.
        
        const pendingDebits = userTransactions
            .filter(tx => tx.status === 'pending' && tx.type === 'debit')
            .reduce((acc, tx) => acc + tx.amount, 0);
        
        // The available balance is the stored balance minus any pending withdrawals.
        const availableBalance = liveUserData.walletBalance - pendingDebits;

        const currentUser = { ...liveUserData, walletBalance: availableBalance };
        setUser(currentUser);
        setTransactions(userTransactions);
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
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
        } else {
            if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/admin')) {
                logout();
            }
        }
    } catch(e) {
        console.error("Error loading user from sessionStorage", e);
        logout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, allTransactions, loading, pathname]);


  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      userId: user.id,
      createdAt: new Date(),
    };
    setAllTransactions(prev => [newTx, ...prev]);
  };
  
  const updateBalance = (newBalance: number) => {
    if(user) {
        setAllUsers(prev => prev.map(u => u.id === user.id ? {...u, walletBalance: newBalance} : u))
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
  
  const reload = () => {
    setLoading(true);
    loadInitialData();
  }

  return (
    <UserContext.Provider value={{ user, setUser, transactions, tournaments, addTransaction, updateBalance, joinTournament, login, signup, logout, reload, toast }}>
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
