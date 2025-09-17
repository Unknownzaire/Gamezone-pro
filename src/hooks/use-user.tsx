

'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
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
  updateBalance: (updater: (currentBalance: number) => number) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  joinTournament: (tournamentId: string, user: User) => void;
  login: (email: string, password: string) => boolean | 'blocked';
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance'>, password?: string, referralCode?: string) => 'success' | 'error';
  logout: () => void;
  reload: () => void;
  toast: ReturnType<typeof useToast>['toast'];
  hasUserJoinedTournament: (userId: string) => boolean;
  moveReferralBonusToWallet: () => void;
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

  const loadInitialData = useCallback(() => {
    try {
        let storedUsers = localStorage.getItem('allUsers');
        let currentUsers: User[];
        if (storedUsers) {
            currentUsers = JSON.parse(storedUsers).map((u: any) => ({...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() }));
        } else {
            localStorage.setItem('allUsers', JSON.stringify(mockUsers));
            currentUsers = mockUsers;
        }
        setAllUsers(currentUsers);
        
        let storedTransactions = localStorage.getItem('allTransactions');
        let currentTransactions: Transaction[];
        if (storedTransactions) {
            currentTransactions = JSON.parse(storedTransactions).map((t: any) => ({...t, createdAt: new Date(t.createdAt)}));
        } else {
            localStorage.setItem('allTransactions', JSON.stringify(mockTransactions));
            currentTransactions = mockTransactions;
        }
        setAllTransactions(currentTransactions);

        let storedTournaments = localStorage.getItem('allTournaments');
        if (storedTournaments) {
            setTournaments(JSON.parse(storedTournaments).map((t: any) => ({...t, matchTime: new Date(t.matchTime)})));
        } else {
            localStorage.setItem('allTournaments', JSON.stringify(initialMockTournaments));
            setTournaments(initialMockTournaments);
        }

        let storedAds = localStorage.getItem('promotionalAds');
        if (storedAds) {
            setPromotionalAds(JSON.parse(storedAds));
        } else {
            localStorage.setItem('promotionalAds', JSON.stringify([]));
            setPromotionalAds([]);
        }

    } catch(e) {
        console.error("Error loading data from localStorage", e);
        setAllUsers(mockUsers);
        setAllTransactions(mockTransactions);
        setTournaments(initialMockTournaments);
        setPromotionalAds([]);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the change is one we care about
      if (['allUsers', 'allTransactions', 'allTournaments', 'promotionalAds', 'walletSettings', 'referralSettings'].includes(event.key || '')) {
        reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadInitialData, reload]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
  }, [allUsers, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('allTransactions', JSON.stringify(allTransactions));
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
    
    loadUserContext(userToLogin.id, allUsers, allTransactions);
    return true;
  };
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'referralBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password'>, password?: string, referralCode?: string): 'success' | 'error' => {
    
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
        const referrer = allUsers.find(u => u.referralCode === referralCode);
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
        walletBalance: 0,
        referralBalance: newUserBonus,
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

  const logout = useCallback(() => {
    sessionStorage.removeItem('currentUser');
    setUser(null);
    setTransactions([]);
    const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked'];
    if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
        router.push('/login');
    }
  }, [pathname, router]);

  const loadUserContext = useCallback((userId: string, currentAllUsers: User[], currentAllTransactions: Transaction[]) => {
    const liveUserData = currentAllUsers.find(u => u.id === userId);

    if (liveUserData) {
        if (liveUserData.isBlocked) {
            logout();
            router.push('/blocked');
            return;
        }

        const userTransactions = currentAllTransactions.filter(tx => tx.userId === liveUserData.id);
        const userReferredUsers = currentAllUsers.filter(u => u.referredBy === liveUserData.id);

        const currentUser = { ...liveUserData };
        setUser(currentUser);
        setTransactions(userTransactions);
        setReferredUsers(userReferredUsers);
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        logout();
    }
  }, [logout, router]);


  useEffect(() => {
    if (loading) return;

    try {
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            const loggedInUser: User = JSON.parse(storedUser);
            const liveUserData = allUsers.find(u => u.id === loggedInUser.id);
            if(liveUserData) {
                 if (JSON.stringify(liveUserData) !== JSON.stringify(user) || transactions.length !== allTransactions.filter(tx => tx.userId === liveUserData.id).length) {
                    loadUserContext(loggedInUser.id, allUsers, allTransactions);
                }
            } else {
                logout();
            }
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
  }, [allUsers, allTransactions, loading, pathname, user, transactions.length, loadUserContext, logout]);


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
  
  const updateBalance = (updater: (currentBalance: number) => number) => {
    if(user) {
        setAllUsers(prevAllUsers => {
            const newAllUsers = prevAllUsers.map(u => 
                u.id === user.id 
                    ? { ...u, walletBalance: updater(u.walletBalance) }
                    : u
            );
            return newAllUsers;
        });
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      setAllUsers(prev => prev.map(u => u.id === user.id ? {...u, ...updatedFields} : u));
    }
  };

  const hasUserJoinedTournament = (userId: string): boolean => {
    return allTransactions.some(tx => 
        tx.userId === userId && 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        tx.description.toLowerCase().startsWith('joined')
    );
  };
  

  const joinTournament = (tournamentId: string, userToJoin: User) => {
    // Check if it's the user's first paid tournament *before* adding the joining transaction
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

            // Update referrer's referral balance
            setAllUsers(prevUsers => prevUsers.map(u => u.id === referrer.id ? { ...u, referralBalance: (u.referralBalance || 0) + bonus } : u));
            
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
        }
    }
  };
  
  const moveReferralBonusToWallet = () => {
    if (!user || !user.referralBalance || user.referralBalance <= 0) return;
    
    const bonusAmount = user.referralBalance;

    updateBalance(balance => balance + bonusAmount);

    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, referralBalance: 0 } : u));
    
    addTransaction({
      amount: bonusAmount,
      type: 'credit',
      description: 'Referral earnings moved to wallet',
      status: 'completed'
    });
  }


  return (
    <UserContext.Provider value={{ user, setUser, transactions, tournaments, setTournaments, promotionalAds, setPromotionalAds, addTransaction, updateBalance, updateUser, joinTournament, login, signup, logout, reload, toast, referredUsers, hasUserJoinedTournament, moveReferralBonusToWallet }}>
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
