'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import { mockUsers, mockTransactions, mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { User, Transaction, Tournament, PromotionalAd, Participant, SupportTicket, SupportTicketMessage } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import type { ReferralSettings } from '@/app/admin/settings/page';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';

type JoinTournamentResult = 'success' | 'already_joined' | 'not_logged_in' | 'tournament_full' | 'insufficient_balance' | 'blocked' | false;


interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  transactions: Transaction[];
  tournaments: Tournament[];
  setTournaments: Dispatch<SetStateAction<Tournament[]>>;
  promotionalAds: PromotionalAd[];
  setPromotionalAds: Dispatch<SetStateAction<PromotionalAd[]>>;
  referredUsers: User[];
  allUsers: User[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  joinTournament: (tournamentId: string, user: User) => JoinTournamentResult;
  login: (email: string, password?: string) => boolean | 'blocked';
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified'>, password: string | undefined, emailVerified: boolean, mobileVerified: boolean, referralCode?: string) => "success" | "error";
  logout: () => void;
  reload: () => void;
  toast: ReturnType<typeof useToast>['toast'];
  hasUserJoinedTournament: (userId: string) => boolean;
  moveReferralBonusToWallet: () => void;
  addSupportTicket: (message: string, imageUrl?: string) => void;
  addMessageToTicket: (ticketId: string, message: string, imageUrl?: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const generateUniqueId = (prefix: string, userId: string) => {
    return `${prefix}-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};


// Let's create a provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, isUserLoading, auth } = useFirebase();
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
        
        // Initialize support tickets if not present
        if (!localStorage.getItem('supportTickets')) {
            localStorage.setItem('supportTickets', JSON.stringify([]));
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
    if (!loading) {
      try {
        localStorage.setItem('promotionalAds', JSON.stringify(promotionalAds));
      } catch (e) {
        console.error("Failed to save promotionalAds:", e);
      }
    }
  }, [promotionalAds, loading]);
  
  useEffect(() => {
    loadInitialData();
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the change is one we care about
      if (['allUsers', 'allTransactions', 'allTournaments', 'promotionalAds', 'walletSettings', 'referralSettings', 'supportTickets'].includes(event.key || '')) {
        reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadInitialData, reload]);

  const saveAllUsers = useCallback((updatedUsers: User[]) => {
      setAllUsers(updatedUsers);
      try {
        localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
      } catch (e) {
        console.error("Failed to save allUsers to localStorage:", e);
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          toast({
            variant: 'destructive',
            title: 'Storage Full',
            description: 'Could not save data. Please try clearing your browser cache or using smaller images.',
          });
        }
      }
  }, [toast]);

  const saveAllTransactions = useCallback((updatedTransactions: Transaction[]) => {
      setAllTransactions(updatedTransactions);
      try {
        localStorage.setItem('allTransactions', JSON.stringify(updatedTransactions));
      } catch (e) {
        console.error("Failed to save allTransactions:", e);
      }
  }, []);

  const saveAllTournaments = useCallback((updatedTournaments: Tournament[]) => {
      setTournaments(updatedTournaments);
      try {
        localStorage.setItem('allTournaments', JSON.stringify(updatedTournaments));
      } catch (e) {
        console.error("Failed to save allTournaments:", e);
      }
  }, []);


  const login = (email: string, password?: string): boolean | 'blocked' => {
    const userToLogin = password 
      ? allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
      : allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
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
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified'>, password: string | undefined, emailVerified: boolean, mobileVerified: boolean, referralCode?: string): 'success' | 'error' => {
    
    // Uniqueness checks
    if (userDetails.email && allUsers.some(u => u.email.toLowerCase() === userDetails.email?.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Email Exists', description: 'An account with this email already exists.' });
        return 'error';
    }
    if (userDetails.username && allUsers.some(u => u.username.toLowerCase() === userDetails.username.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Username Taken', description: 'This username is already in use.' });
        return 'error';
    }
    if (userDetails.bgmiUsername && allUsers.some(u => u.bgmiUsername?.toLowerCase() === userDetails.bgmiUsername?.toLowerCase())) {
        toast({ variant: 'destructive', title: 'BGMI Username Taken', description: 'This BGMI username is already in use.' });
        return 'error';
    }
    
    let newUserBonus = 0;
    let referredBy: string | undefined = undefined;
    let referrer: User | undefined;

    if (referralCode) {
        referrer = allUsers.find(u => u.referralCode === referralCode);
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
    
    const newUserId = userDetails.googleId || generateUniqueId('user', '');
    const newUser: User = {
        ...userDetails,
        password: password,
        id: newUserId,
        walletBalance: newUserBonus,
        referralBalance: 0,
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
        isBlocked: false,
        createdAt: new Date(),
        referredBy,
        referralCode: generateUniqueReferralCode(),
        emailVerified: emailVerified,
        mobileVerified: mobileVerified,
    };
    
    let updatedTransactions = [...allTransactions];
    if (newUserBonus > 0 && referrer) {
      const bonusTransaction: Transaction = {
        id: generateUniqueId('tx-signup-bonus', newUserId),
        userId: newUserId,
        amount: newUserBonus,
        type: 'credit',
        description: `Sign-up bonus added to wallet (referred by ${referrer.username})`,
        createdAt: new Date(),
        status: 'completed'
      };
      updatedTransactions = [bonusTransaction, ...updatedTransactions];
    }
    
    saveAllTransactions(updatedTransactions);
    saveAllUsers([...allUsers, newUser]);
    
    toast({
      title: 'Sign Up Successful',
      description: 'Welcome to Gamezone Pro! Please log in to continue.',
    });
    
    return 'success';
  };

  const logout = useCallback(() => {
    if (!auth) return;
    signOut(auth).then(() => {
      sessionStorage.removeItem('currentUser');
      setUser(null);
      setTransactions([]);
      setReferredUsers([]);
      const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked', '/reset-password'];
      if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
          router.push('/login');
      }
    }).catch((error) => {
        console.error("Logout Error: ", error);
        toast({
            variant: 'destructive',
            title: 'Logout Failed',
            description: 'An error occurred during logout. Please try again.',
        });
    });
  }, [auth, pathname, router, toast]);

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
    if (isUserLoading || loading) return;

    if (firebaseUser) {
      const liveUserData = allUsers.find(u => u.googleId === firebaseUser.uid || u.email === firebaseUser.email);
      if (liveUserData) {
        if (JSON.stringify(liveUserData) !== JSON.stringify(user)) {
          loadUserContext(liveUserData.id, allUsers, allTransactions);
        }
      } else {
        // This case can be for a new Google Sign-in user who needs to be added to the local mock data
        // This logic is mostly handled in login page, but as a fallback:
        console.log("Firebase user found but no matching local user. Consider signup flow.");
      }
    } else {
       const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked', '/reset-password'];
       if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
           logout();
       }
    }
  }, [firebaseUser, isUserLoading, allUsers, allTransactions, loading, pathname, user, loadUserContext, logout]);


  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...tx,
      id: generateUniqueId('tx', user.id),
      userId: user.id,
      createdAt: new Date(),
    };
    saveAllTransactions([newTx, ...allTransactions]);
  };
  
  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUsers = allUsers.map(u => u.id === user.id ? {...u, ...updatedFields} : u);
      saveAllUsers(updatedUsers);
    }
  };

  const hasUserJoinedTournament = (userId: string): boolean => {
    // Check against all transactions, not just the current user's
    return allTransactions.some(tx => 
        tx.userId === userId && 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        tx.description.toLowerCase().startsWith('joined')
    );
  };
  

  const joinTournament = (tournamentId: string, userToJoin: User): JoinTournamentResult => {
      const tournament = tournaments.find(t => t.id === tournamentId);

      if (!tournament) return false; // Should not happen
      if (!userToJoin) {
          toast({ variant: 'destructive', title: "Not Logged In", description: "Please log in to join a tournament." });
          return 'not_logged_in';
      }
      if (userToJoin.isBlocked) {
          toast({ variant: 'destructive', title: "Account Blocked", description: "Your account is blocked and cannot join tournaments." });
          return 'blocked';
      }
      if (tournament.participants.some(p => p.user.id === userToJoin.id)) {
          toast({ variant: 'destructive', title: "Already Joined", description: "You have already joined this tournament." });
          return 'already_joined';
      }
      if (tournament.participants.length >= 100) {
          toast({ variant: 'destructive', title: "Tournament Full", description: "This tournament has reached its maximum capacity." });
          return 'tournament_full';
      }
      if (userToJoin.walletBalance < tournament.entryFee) {
          toast({ variant: 'destructive', title: "Insufficient Balance", description: `You need ₹${tournament.entryFee} to join. Please add funds.` });
          return 'insufficient_balance';
      }

      const isFirstTournament = !hasUserJoinedTournament(userToJoin.id);

      // 1. Update User's balance and tournament participants
      let updatedUsers = [...allUsers];
      const updatedTournaments = tournaments.map(t => {
          if (t.id === tournamentId) {
              const newParticipant: Participant = {
                  id: generateUniqueId(`p-${t.id}`, userToJoin.id),
                  user: userToJoin,
                  tournamentId: t.id,
                  result: null,
                  joinedAt: new Date(),
              };
              updatedUsers = updatedUsers.map(u => u.id === userToJoin.id ? { ...u, walletBalance: u.walletBalance - tournament.entryFee } : u);
              return { ...t, participants: [...t.participants, newParticipant] };
          }
          return t;
      });
      
      // 2. Add join transaction
      const newTransaction: Transaction = {
          id: generateUniqueId('tx-join', userToJoin.id),
          userId: userToJoin.id,
          amount: tournament.entryFee,
          type: 'debit',
          description: `Joined "${tournament.title}"`,
          createdAt: new Date(),
          status: 'completed'
      };
      let updatedTransactions = [newTransaction, ...allTransactions];
      
      // 3. Handle referral bonus if applicable
      if (isFirstTournament && userToJoin.referredBy) {
          const referrer = updatedUsers.find(u => u.id === userToJoin.referredBy);
          if (referrer) {
              const storedSettings = localStorage.getItem('referralSettings');
              const settings: ReferralSettings = storedSettings ? JSON.parse(storedSettings) : { referralBonus: 25, newUserBonus: 25 };
              const bonus = settings.referralBonus;

              updatedUsers.forEach(u => {
                  if (u.id === referrer.id) {
                      u.referralBalance = (u.referralBalance || 0) + bonus;
                  }
              });

              const bonusTransaction: Transaction = {
                  id: generateUniqueId('tx-referral-bonus', referrer.id),
                  userId: referrer.id,
                  amount: bonus,
                  type: 'credit',
                  description: `Referral bonus for ${userToJoin.username}`,
                  createdAt: new Date(),
                  status: 'completed'
              };
              updatedTransactions = [bonusTransaction, ...updatedTransactions];
          }
      }

      // 4. Save all state updates
      saveAllUsers(updatedUsers);
      saveAllTransactions(updatedTransactions);
      saveAllTournaments(updatedTournaments);

      return 'success';
  };
  
  const moveReferralBonusToWallet = () => {
    if (!user || !user.referralBalance || user.referralBalance <= 0) return;
    
    const bonusAmount = user.referralBalance;

    const updatedUsers = allUsers.map(u => {
        if (u.id === user.id) {
            return {
                ...u,
                walletBalance: u.walletBalance + bonusAmount,
                referralBalance: 0,
            };
        }
        return u;
    });
    saveAllUsers(updatedUsers);
    
    addTransaction({
      amount: bonusAmount,
      type: 'credit',
      description: 'Referral earnings moved to wallet',
      status: 'completed'
    });
  }
  
  const addSupportTicket = (message: string, imageUrl?: string) => {
    if (!user) return;
    
    const initialMessage: SupportTicketMessage = {
      sender: 'user',
      text: message,
      createdAt: new Date(),
    };
    if (imageUrl) {
      initialMessage.imageUrl = imageUrl;
    }
    
    const newTicket: SupportTicket = {
      id: generateUniqueId('ticket', user.id),
      userId: user.id,
      subject: message.substring(0, 50),
      status: 'open',
      createdAt: new Date(),
      messages: [initialMessage],
    };

    const storedTickets = localStorage.getItem('supportTickets');
    const allTickets: SupportTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
    const updatedTickets = [newTicket, ...allTickets];
    try {
      localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
    } catch (e) {
      console.error("Failed to save supportTickets:", e);
    }
  };
  
  const addMessageToTicket = (ticketId: string, message: string, imageUrl?: string) => {
    const storedTickets = localStorage.getItem('supportTickets');
    const allTickets: SupportTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
    
    const updatedTickets = allTickets.map(ticket => {
      if (ticket.id === ticketId) {
        const newMessage: SupportTicketMessage = {
          sender: 'user',
          text: message,
          createdAt: new Date(),
        };
        if (imageUrl) {
          newMessage.imageUrl = imageUrl;
        }
        return {
          ...ticket,
          status: 'open' as const,
          messages: [...ticket.messages, newMessage]
        };
      }
      return ticket;
    });

    try {
      localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
    } catch (e) {
      console.error("Failed to save supportTickets message:", e);
    }
    reload(); // Force a reload to update UI everywhere
  };


  return (
    <UserContext.Provider value={{ user, setUser, transactions, tournaments, setTournaments, promotionalAds, setPromotionalAds, addTransaction, updateUser, joinTournament, login, signup, logout, reload, toast, referredUsers, hasUserJoinedTournament, moveReferralBonusToWallet, allUsers, addSupportTicket, addMessageToTicket }}>
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
