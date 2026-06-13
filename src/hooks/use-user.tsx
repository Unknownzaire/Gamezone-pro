
'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import { mockUsers, mockTransactions, mockTournaments as initialMockTournaments, mockPromotionalAds } from '@/lib/mock-data';
import { User, Transaction, Tournament, PromotionalAd, Participant, SupportTicket, SupportTicketMessage, Notification, GameProfile, RedeemCode } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import type { ReferralSettings } from '@/app/admin/settings/page';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';

type JoinTournamentFailure = { error: string; user: User };
type JoinTournamentResult = 'success' | 'not_logged_in' | 'tournament_full' | false;


interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  transactions: Transaction[];
  allTransactions: Transaction[];
  tournaments: Tournament[];
  setTournaments: Dispatch<SetStateAction<Tournament[]>>;
  promotionalAds: PromotionalAd[];
  setPromotionalAds: Dispatch<SetStateAction<PromotionalAd[]>>;
  referredUsers: User[];
  allUsers: User[];
  notifications: Notification[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  joinTournament: (tournamentId: string, usersToJoin: User[]) => JoinTournamentResult | JoinTournamentFailure;
  joinTeam: (teamName: string) => 'success' | 'already_in_team' | 'team_full' | 'error';
  login: (email: string, password?: string) => boolean | 'blocked';
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified' | 'teamJoinedAt' | 'gameProfiles'> & {inGameUsername?: string, inGameId?: string}, password: string | undefined, emailVerified: boolean, mobileVerified: boolean, referralCode?: string) => "success" | "error";
  logout: () => void;
  reload: () => void;
  toast: ReturnType<typeof useToast>['toast'];
  hasUserJoinedTournament: (userId: string) => boolean;
  moveReferralBonusToWallet: () => void;
  addSupportTicket: (message: string, imageUrl?: string) => void;
  addMessageToTicket: (ticketId: string, message: string, imageUrl?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationsAsRead: () => void;
  removeUserFromTeam: (userId: string) => void;
  joinTeam: (teamName: string) => 'success' | 'already_in_team' | 'team_full' | 'error';
  redeemCode: (code: string) => Promise<'success' | 'invalid' | 'already_used' | 'error'>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const generateUniqueId = (prefix: string, userId: string) => {
    return `${prefix}-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};


// Safe localStorage write wrapper
const saveToStorage = (key: string, data: any, toast: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      toast({
        variant: 'destructive',
        title: 'Storage Full',
        description: `Could not save ${key}. Please try deleting old data or using smaller images.`,
      });
    }
    return false;
  }
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, isUserLoading, auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [promotionalAds, setPromotionalAds] = useState<PromotionalAd[]>([]);
  const [referredUsers, setReferredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsInitialized, setAdsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const loadInitialData = useCallback(() => {
    try {
        let storedUsers = localStorage.getItem('allUsers');
        let currentUsers: User[];
        if (storedUsers) {
            currentUsers = JSON.parse(storedUsers).map((u: any) => ({
                ...u, 
                createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
                teamJoinedAt: u.teamJoinedAt ? new Date(u.teamJoinedAt) : undefined,
            }));
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
            localStorage.setItem('promotionalAds', JSON.stringify(mockPromotionalAds));
            setPromotionalAds(mockPromotionalAds);
        }
        setAdsInitialized(true);
        
        let storedNotifications = localStorage.getItem('allNotifications');
        if (storedNotifications) {
            setAllNotifications(JSON.parse(storedNotifications).map((n: any) => ({...n, createdAt: new Date(n.createdAt)})));
        } else {
            const mockNotifications: Notification[] = [];
            localStorage.setItem('allNotifications', JSON.stringify(mockNotifications));
            setAllNotifications(mockNotifications);
        }

    } catch(e) {
        console.error("Error loading data from localStorage", e);
    }
    setLoading(false);
  }, []);

  const reload = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
    const handleStorageChange = (event: StorageEvent) => {
      if (['allUsers', 'allTransactions', 'allTournaments', 'promotionalAds', 'walletSettings', 'referralSettings', 'supportTickets', 'allNotifications', 'redeemCodes'].includes(event.key || '')) {
        reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', reload);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', reload);
    };
  }, [loadInitialData, reload]);

  // Sync promotionalAds to localStorage
  useEffect(() => {
    if (adsInitialized) {
      localStorage.setItem('promotionalAds', JSON.stringify(promotionalAds));
    }
  }, [promotionalAds, adsInitialized]);

  const saveAllUsers = useCallback((updatedUsers: User[]) => {
      setAllUsers(updatedUsers);
      saveToStorage('allUsers', updatedUsers, toast);
  }, [toast]);

  const saveAllTransactions = useCallback((updatedTransactions: Transaction[]) => {
      setAllTransactions(updatedTransactions);
      saveToStorage('allTransactions', updatedTransactions, toast);
  }, [toast]);

  const saveAllTournaments = useCallback((updatedTournaments: Tournament[]) => {
      setTournaments(updatedTournaments);
      saveToStorage('allTournaments', updatedTournaments, toast);
  }, [toast]);

  const saveAllNotifications = useCallback((updatedNotifications: Notification[]) => {
      setAllNotifications(updatedNotifications);
      saveToStorage('allNotifications', updatedNotifications, toast);
  }, [toast]);


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
    
    loadUserContext(userToLogin.id, allUsers, allTransactions, allNotifications);
    return true;
  };
  
  const signup = (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified' | 'teamJoinedAt' | 'gameProfiles'> & {inGameUsername?: string, inGameId?: string}, password: string | undefined, emailVerified: boolean, mobileVerified: boolean, referralCode?: string): 'success' | 'error' => {
    
    if (userDetails.email && allUsers.some(u => u.email.toLowerCase() === userDetails.email?.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Email Exists', description: 'An account with this email already exists.' });
        return 'error';
    }
    if (userDetails.username && allUsers.some(u => u.username.toLowerCase() === userDetails.username.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Username Taken', description: 'This username is already in use.' });
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
        username: userDetails.username,
        email: userDetails.email,
        mobile: userDetails.mobile,
        primaryGame: userDetails.primaryGame,
        referralCode: generateUniqueReferralCode(),
        googleId: userDetails.googleId,
        otp: userDetails.otp,
        password: password,
        id: newUserId,
        walletBalance: newUserBonus,
        referralBalance: 0,
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
        isBlocked: false,
        createdAt: new Date(),
        referredBy,
        emailVerified: emailVerified,
        mobileVerified: mobileVerified,
        gameProfiles: (userDetails.primaryGame && userDetails.inGameUsername && userDetails.inGameId) ? {
          [userDetails.primaryGame]: {
            inGameUsername: userDetails.inGameUsername,
            inGameId: userDetails.inGameId,
          }
        } : {},
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
      setNotifications([]);
      const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked', '/reset-password'];
      if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
          router.push('/login');
      }
    }).catch((error) => {
        console.error("Logout Error: ", error);
    });
  }, [auth, pathname, router]);

  const loadUserContext = useCallback((userId: string, currentAllUsers: User[], currentAllTransactions: Transaction[], currentAllNotifications: Notification[]) => {
    const liveUserData = currentAllUsers.find(u => u.id === userId);

    if (liveUserData) {
        if (liveUserData.isBlocked) {
            logout();
            router.push('/blocked');
            return;
        }

        const userTransactions = currentAllTransactions.filter(tx => tx.userId === liveUserData.id);
        const userReferredUsers = currentAllUsers.filter(u => u.referredBy === liveUserData.id);
        const userNotifications = currentAllNotifications
            .filter(n => n.userId === liveUserData.id)
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const currentUser = { ...liveUserData };
        setUser(currentUser);
        setTransactions(userTransactions);
        setReferredUsers(userReferredUsers);
        setNotifications(userNotifications);
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
          loadUserContext(liveUserData.id, allUsers, allTransactions, allNotifications);
        }
      }
    } else {
       const nonUserRoutes = ['/login', '/signup', '/admin', '/forgot-password', '/blocked', '/reset-password'];
       if (!nonUserRoutes.some(route => pathname.startsWith(route))) {
           logout();
       }
    }
  }, [firebaseUser, isUserLoading, allUsers, allTransactions, allNotifications, loading, pathname, user, loadUserContext, logout]);


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

  const joinTeam = (teamName: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to join a team.' });
        router.push(`/login?action=join&team=${encodeURIComponent(teamName)}`);
        return 'error';
    }
    if (user.teamName) {
        return 'already_in_team';
    }
    const teamMembersCount = allUsers.filter(u => u.teamName === teamName).length;
    if (teamMembersCount >= 4) {
        return 'team_full';
    }
    updateUser({ teamName, teamJoinedAt: new Date() });
    toast({ title: 'Joined Team!', description: `You are now a member of "${teamName}".` });
    return 'success';
  };

  const hasUserJoinedTournament = (userId: string): boolean => {
    return allTransactions.some(tx => 
        tx.userId === userId && 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        tx.description.toLowerCase().startsWith('joined "') &&
        !tx.description.toLowerCase().includes('lucky draw')
    );
  };
  
  const removeUserFromTeam = (userId: string) => {
    const userToRemove = allUsers.find(u => u.id === userId);
    if (!userToRemove) return;

    const updatedUsers = allUsers.map(u => 
        u.id === userId ? { ...u, teamName: undefined, teamJoinedAt: undefined } : u
    );
    saveAllUsers(updatedUsers);
    
    toast({
        title: 'Member Removed',
        description: `${userToRemove.username} has been removed from the team.`,
    });
  };

  const joinTournament = (tournamentId: string, usersToJoin: User[]): JoinTournamentResult | JoinTournamentFailure => {
    const tournament = tournaments.find(t => t.id === tournamentId);

    if (!tournament) return false;

    for (const userToJoin of usersToJoin) {
        if (!userToJoin) return 'not_logged_in';
        if (userToJoin.isBlocked) return { error: `Account is blocked.`, user: userToJoin };
        if (userToJoin.walletBalance < tournament.entryFee) return { error: `Insufficient balance.`, user: userToJoin };
    }
    
    if ((tournament.participants.length + usersToJoin.length) > tournament.slots) {
        return 'tournament_full';
    }

    let updatedUsers = [...allUsers];
    let updatedTransactions = [...allTransactions];
    const newParticipants: Participant[] = [];

    for (const userToJoin of usersToJoin) {
        const isFirstTournament = !hasUserJoinedTournament(userToJoin.id);
        const updatedUser = { ...userToJoin, walletBalance: userToJoin.walletBalance - tournament.entryFee };

        updatedUsers = updatedUsers.map(u => u.id === userToJoin.id ? updatedUser : u);

        const newTransaction: Transaction = {
            id: generateUniqueId('tx-join', userToJoin.id),
            userId: userToJoin.id,
            amount: tournament.entryFee,
            type: 'debit',
            description: `Joined "${tournament.title}"`,
            createdAt: new Date(),
            status: 'completed'
        };
        updatedTransactions.push(newTransaction);
        
        newParticipants.push({
            id: generateUniqueId(`p-${tournament.id}`, userToJoin.id),
            user: updatedUser,
            tournamentId: tournament.id,
            result: null,
            joinedAt: new Date(),
        });
        
        if (isFirstTournament && userToJoin.referredBy) {
            const referrer = updatedUsers.find(u => u.id === userToJoin.referredBy);
            if (referrer) {
                const storedSettings = localStorage.getItem('referralSettings');
                const settings: ReferralSettings = storedSettings ? JSON.parse(storedSettings) : { referralBonus: 25, newUserBonus: 25 };
                const bonus = settings.referralBonus;

                updatedUsers = updatedUsers.map(u => u.id === referrer.id ? { ...u, referralBalance: (u.referralBalance || 0) + bonus } : u);

                const bonusTransaction: Transaction = {
                    id: generateUniqueId('tx-referral-bonus', referrer.id),
                    userId: referrer.id,
                    amount: bonus,
                    type: 'credit',
                    description: `Referral bonus for ${userToJoin.username}`,
                    createdAt: new Date(),
                    status: 'completed'
                };
                updatedTransactions.push(bonusTransaction);
            }
        }
    }

    const updatedTournaments = tournaments.map(t => 
        t.id === tournamentId 
            ? { ...t, participants: [...t.participants, ...newParticipants] } 
            : t
    );

    saveAllUsers(updatedUsers);
    saveAllTransactions(updatedTransactions);
    saveAllTournaments(updatedTournaments);

    return 'success';
  };
  
  const moveReferralBonusToWallet = () => {
    if (!user || !user.referralBalance || user.referralBalance <= 0) return;
    
    const bonusAmount = user.referralBalance;

    const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, walletBalance: u.walletBalance + bonusAmount, referralBalance: 0 } : u);
    saveAllUsers(updatedUsers);
    
    addTransaction({
      amount: bonusAmount,
      type: 'credit',
      description: 'Referral earnings moved to wallet',
      status: 'completed'
    });
  };
  
  const addSupportTicket = (message: string, imageUrl?: string) => {
    if (!user) return;
    const initialMessage: SupportTicketMessage = { sender: 'user', text: message, createdAt: new Date(), imageUrl };
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
    saveToStorage('supportTickets', [newTicket, ...allTickets], toast);
  };
  
  const addMessageToTicket = (ticketId: string, message: string, imageUrl?: string) => {
    const storedTickets = localStorage.getItem('supportTickets');
    const allTickets: SupportTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
    const updatedTickets = allTickets.map(ticket => {
      if (ticket.id === ticketId) {
        return { ...ticket, status: 'open' as const, messages: [...ticket.messages, { sender: 'user', text: message, createdAt: new Date(), imageUrl }] };
      }
      return ticket;
    });
    saveToStorage('supportTickets', updatedTickets, toast);
    reload(); 
  };
  
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: Notification = { ...notification, id: generateUniqueId('notif', notification.userId), createdAt: new Date(), read: false };
      saveAllNotifications([newNotification, ...allNotifications]);
  };

  const markNotificationsAsRead = () => {
      if (!user) return;
      saveAllNotifications(allNotifications.map(n => n.userId === user.id ? { ...n, read: true } : n));
  };

  const redeemCode = async (code: string): Promise<'success' | 'invalid' | 'already_used' | 'error'> => {
    if (!user) return 'error';

    const storedCodes = localStorage.getItem('redeemCodes');
    const codes: RedeemCode[] = storedCodes ? JSON.parse(storedCodes) : [];
    
    const redeemCodeIndex = codes.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
    if (redeemCodeIndex === -1) return 'invalid';
    
    const redeemCode = codes[redeemCodeIndex];
    if (redeemCode.usedBy.includes(user.id)) return 'already_used';
    if (redeemCode.usedCount >= redeemCode.usageLimit) return 'already_used';
    
    const updatedUser = { ...user, walletBalance: user.walletBalance + redeemCode.amount };
    const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
    
    const updatedCodes = codes.map((c, i) => i === redeemCodeIndex ? {
        ...c,
        status: (c.usedCount + 1 >= c.usageLimit) ? 'used' as const : 'active' as const,
        usedCount: c.usedCount + 1,
        usedBy: [...c.usedBy, user.id]
    } : c);

    const newTransaction: Transaction = {
        id: generateUniqueId('tx-redeem', user.id),
        userId: user.id,
        amount: redeemCode.amount,
        type: 'credit',
        description: `Redeemed Code: ${code.toUpperCase()}`,
        createdAt: new Date(),
        status: 'completed',
        paymentDetails: { method: 'redeem_code', code: code.toUpperCase() }
    };

    saveToStorage('redeemCodes', updatedCodes, toast);
    saveAllUsers(updatedUsers);
    saveAllTransactions([newTransaction, ...allTransactions]);
    
    return 'success';
  };


  return (
    <UserContext.Provider value={{ user, setUser, transactions, allTransactions, tournaments, setTournaments, promotionalAds, setPromotionalAds, addTransaction, updateUser, joinTournament, login, signup, logout, reload, toast, referredUsers, hasUserJoinedTournament, moveReferralBonusToWallet, allUsers, addSupportTicket, addMessageToTicket, notifications, addNotification, markNotificationsAsRead, removeUserFromTeam, joinTeam, redeemCode }}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
