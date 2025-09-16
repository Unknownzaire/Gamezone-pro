

'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { mockUsers, mockTransactions, mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { User, Transaction, Tournament, PromotionalAd, Participant } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { ReferralSettings } from '@/app/admin/settings/page';

// Let's create a very simple global state for our user
// In a real app, you'd use a more robust state management library or React Context with more features

interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  transactions: Transaction[];
  tournaments: Tournament[];
  setTournaments: Dispatch<SetStateAction<Tournament[]>>;
  promotionalAds: PromotionalAd[];
  setPromotionalAds: Dispatch<SetStateAction<PromotionalAd[]>>;
  referredUsers: User[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateBalance: (newBalance: number) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  joinTournament: (tournamentId: string, user: User) => void;
  login: (email: string, password: string) => boolean | 'blocked';
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password'>, password?: string, referralCode?: string) => 'success' | 'error';
  logout: () => void;
  reload: () => void;
  toast: ReturnType<typeof useToast>['toast'];
  hasUserJoinedTournament: (userId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Let's create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [promotionalAds, setPromotionalAds] = useState<PromotionalAd[]>([]);
  const [referredUsers, setReferredUsers] = useState<User[]>([]);
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

        const storedTournaments = localStorage.getItem('allTournaments');
        if (storedTournaments) {
            setTournaments(JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})));
        } else {
            setTournaments(initialMockTournaments);
            localStorage.setItem('allTournaments', JSON.stringify(initialMockTournaments));
        }

        const storedAds = localStorage.getItem('promotionalAds');
        if (storedAds) {
            setPromotionalAds(JSON.parse(storedAds));
        } else {
            localStorage.setItem('promotionalAds', JSON.stringify([]));
        }

    } catch(e) {
        console.error("Error loading data from localStorage", e);
        setAllUsers(mockUsers);
        setAllTransactions(mockTransactions);
        setTournaments(initialMockTournaments);
        setPromotionalAds([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadInitialData();

     const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'allTournaments' || event.key === 'promotionalAds' || event.key === 'referralSettings') {
        loadInitialData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

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
  
  useEffect(() => {
    if (!loading) {
        localStorage.setItem('allTournaments', JSON.stringify(tournaments));
    }
  }, [tournaments, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('promotionalAds', JSON.stringify(promotionalAds));
    }
  }, [promotionalAds, loading]);

  const login = (email: string, password: string): boolean | 'blocked' => {
    const userToLogin = allUsers.find(u => u.email === email && u.password === password);
    
    if (!userToLogin) {
      return false; 
    }

    if (userToLogin.isBlocked) {
        router.push('/blocked');
        return 'blocked';
    }
    
    loadUserContext(userToLogin.id);
    return true;
  };
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'referralCode' | 'password'>, password?: string, referralCode?: string): 'success' | 'error' => {
    
    // Uniqueness checks
    if (allUsers.some(u => u.username.toLowerCase() === userDetails.username.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Username Taken', description: 'This username is already in use.' });
        return 'error';
    }
    if (allUsers.some(u => u.email.toLowerCase() === userDetails.email.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Email Exists', description: 'An account with this email already exists.' });
        return 'error';
    }
    if (allUsers.some(u => u.mobile === userDetails.mobile)) {
        toast({ variant: 'destructive', title: 'Mobile Number Exists', description: 'An account with this mobile number already exists.' });
        return 'error';
    }
    if (userDetails.bgmiUsername && allUsers.some(u => u.bgmiUsername?.toLowerCase() === userDetails.bgmiUsername!.toLowerCase())) {
        toast({ variant: 'destructive', title: 'BGMI Username Taken', description: 'This BGMI username is already linked to an account.' });
        return 'error';
    }
    if (userDetails.bgmiId && allUsers.some(u => u.bgmiId === userDetails.bgmiId)) {
        toast({ variant: 'destructive', title: 'BGMI ID Exists', description: 'This BGMI ID is already linked to an account.' });
        return 'error';
    }

    let newUserBonus = 0;
    let referredBy: string | undefined = undefined;
    if (referralCode) {
        const referrer = allUsers.find(u => u.bgmiId === referralCode || u.id === referralCode || u.referralCode === referralCode);
        if (referrer) {
            referredBy = referrer.id;
            const storedSettings = localStorage.getItem('referralSettings');
            const settings: ReferralSettings = storedSettings ? JSON.parse(storedSettings) : { referralBonus: 25, newUserBonus: 25 };
            newUserBonus = settings.newUserBonus;
        } else {
           toast({ variant: 'destructive', title: 'Invalid Referral Code', description: 'The referral code you entered is not valid.' });
           return 'error';
        }
    }

    const generateUniqueReferralCode = (): string => {
        let newCode;
        let isUnique = false;
        while (!isUnique) {
            newCode = Math.floor(100000 + Math.random() * 900000).toString();
            if (!allUsers.some(u => u.referralCode === newCode)) {
                isUnique = true;
            }
        }
        return newCode!;
    };
    
    const newUser: User = {
        ...userDetails,
        password: password,
        id: `user-${Date.now()}`,
        walletBalance: newUserBonus,
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
        isBlocked: false,
        createdAt: new Date(),
        referredBy,
        referralCode: generateUniqueReferralCode(),
    };
    
    let updatedTransactions = [...allTransactions];
    if (newUserBonus > 0) {
      const bonusTransaction: Transaction = {
        id: `tx-new-user-bonus-${newUser.id}`,
        userId: newUser.id,
        amount: newUserBonus,
        type: 'credit',
        description: 'New user referral bonus',
        createdAt: new Date(),
        status: 'completed'
      };
      updatedTransactions = [bonusTransaction, ...updatedTransactions];
    }
    
    setAllTransactions(updatedTransactions);
    setAllUsers(prevUsers => [...prevUsers, newUser]);
    
    toast({
      title: 'Sign Up Successful',
      description: 'Welcome to Arena Ace! Please log in to continue.',
    });
    
    return 'success';
  };

  const logout = () => {
    sessionStorage.removeItem('currentUser');
    setUser(null);
    setTransactions([]);
    const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked'];
    if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
        router.push('/login');
    }
  }

  const loadUserContext = (userId: string) => {
    const liveUserData = allUsers.find(u => u.id === userId);

    if (liveUserData) {
        if (liveUserData.isBlocked) {
            logout();
            router.push('/blocked');
            return;
        }

        const userTransactions = allTransactions.filter(tx => tx.userId === liveUserData.id);
        const userReferredUsers = allUsers.filter(u => u.referredBy === liveUserData.id);

        const currentUser = { ...liveUserData };
        setUser(currentUser);
        setTransactions(userTransactions);
        setReferredUsers(userReferredUsers);
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
            const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked'];
             if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
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
    
    // For pending withdrawals, deduct from balance immediately.
    if(newTx.type === 'debit' && newTx.status === 'pending') {
      updateBalance(user.walletBalance - newTx.amount);
    }
    
    setAllTransactions(prev => [newTx, ...prev]);
  };
  
  const updateBalance = (newBalance: number) => {
    if(user) {
        setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, walletBalance: newBalance} : u))
    }
  }

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      setAllUsers(prev => prev.map(u => u.id === user.id ? {...u, ...updatedFields} : u));
    }
  };

  const hasUserJoinedTournament = (userId: string): boolean => {
    return tournaments.some(t => t.participants.some(p => p.user.id === userId));
  };

  const joinTournament = (tournamentId: string, userToJoin: User) => {
    const isFirstTournament = !hasUserJoinedTournament(userToJoin.id);

    setTournaments(prevTournaments => 
      prevTournaments.map(t => {
        if (t.id === tournamentId) {
          if (t.participants.some(p => p.user.id === userToJoin.id)) {
            return t; 
          }
          const newParticipant: Participant = {
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

    if (isFirstTournament && userToJoin.referredBy) {
        const referrer = allUsers.find(u => u.id === userToJoin.referredBy);
        if (referrer) {
            const storedSettings = localStorage.getItem('referralSettings');
            const settings: ReferralSettings = storedSettings ? JSON.parse(storedSettings) : { referralBonus: 25, newUserBonus: 25 };
            const bonus = settings.referralBonus;

            // Update referrer's balance
            setAllUsers(prevUsers => prevUsers.map(u => u.id === referrer.id ? { ...u, walletBalance: u.walletBalance + bonus } : u));
            
            // Create transaction for referrer
            const bonusTransaction: Transaction = {
                id: `tx-referral-bonus-${userToJoin.id}`,
                userId: referrer.id,
                amount: bonus,
                type: 'credit',
                description: `Referral bonus for ${userToJoin.username}`,
                createdAt: new Date(),
                status: 'completed'
            };
            setAllTransactions(prevTxs => [bonusTransaction, ...prevTxs]);
            
            // This toast is for the joining user, might want a different notification system for the referrer
            console.log(`Referrer ${referrer.username} has been awarded a bonus of ₹${bonus}.`);
        }
    }
  };
  
  const reload = () => {
    setLoading(true);
    loadInitialData();
  }


  return (
    <UserContext.Provider value={{ user, setUser, transactions, tournaments, setTournaments, promotionalAds, setPromotionalAds, addTransaction, updateBalance, updateUser, joinTournament, login, signup, logout, reload, toast, referredUsers, hasUserJoinedTournament }}>
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
