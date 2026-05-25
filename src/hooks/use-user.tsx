
'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import { mockUsers, mockTransactions, mockTournaments as initialMockTournaments } from '@/lib/mock-data';
import { User, Transaction, Tournament, PromotionalAd, Participant, SupportTicket, SupportTicketMessage, Notification, GameProfile } from '@/lib/types';
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
            localStorage.setItem('promotionalAds', JSON.stringify([]));
            setPromotionalAds([]);
        }
        
        let storedNotifications = localStorage.getItem('allNotifications');
        if (storedNotifications) {
            setAllNotifications(JSON.parse(storedNotifications).map((n: any) => ({...n, createdAt: new Date(n.createdAt)})));
        } else {
            const mockNotifications: Notification[] = [
                {
                  id: 'notif-1',
                  userId: 'user-1',
                  title: 'Tournament Starting!',
                  description: 'Midnight Mayhem is about to start in 15 minutes.',
                  createdAt: new Date(Date.now() - 5 * 60 * 1000),
                  read: false,
                  link: '/tournaments/t-2',
                },
                {
                  id: 'notif-2',
                  userId: 'user-1',
                  title: 'Prize Credited',
                  description: 'You won ₹1,500 from Victory Valley.',
                  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                  read: false,
                  link: '/wallet',
                },
                {
                  id: 'notif-3',
                  userId: 'user-1',
                  title: 'Withdrawal Processed',
                  description: 'Your withdrawal of ₹500 was successful.',
                  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                  read: true,
                  link: '/wallet',
                },
            ];
            localStorage.setItem('allNotifications', JSON.stringify(mockNotifications));
            setAllNotifications(mockNotifications);
        }

        if (!localStorage.getItem('supportTickets')) {
            localStorage.setItem('supportTickets', JSON.stringify([]));
        }

    } catch(e) {
        console.error("Error loading data from localStorage", e);
        setAllUsers(mockUsers);
        setAllTransactions(mockTransactions);
        setTournaments(initialMockTournaments);
        setPromotionalAds([]);
        setAllNotifications([]);
    }
    setLoading(false);
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!loading) {
      saveToStorage('promotionalAds', promotionalAds, toast);
    }
  }, [promotionalAds, loading, toast]);
  
  useEffect(() => {
    loadInitialData();
    const handleStorageChange = (event: StorageEvent) => {
      if (['allUsers', 'allTransactions', 'allTournaments', 'promotionalAds', 'walletSettings', 'referralSettings', 'supportTickets', 'allNotifications'].includes(event.key || '')) {
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
    if (userDetails.inGameUsername && allUsers.some(u => u.gameProfiles && Object.values(u.gameProfiles).some(p => p.inGameUsername?.toLowerCase() === userDetails.inGameUsername?.toLowerCase()))) {
        toast({ variant: 'destructive', title: 'In-Game Username Taken', description: 'This in-game username is already in use.' });
        return 'error';
    }
     if (userDetails.inGameId && allUsers.some(u => u.gameProfiles && Object.values(u.gameProfiles).some(p => p.inGameId === userDetails.inGameId))) {
        toast({ variant: 'destructive', title: 'In-Game User ID Taken', description: 'This in-game User ID is already in use.' });
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
        toast({
            variant: 'destructive',
            title: 'Logout Failed',
            description: 'An error occurred during logout. Please try again.',
        });
    });
  }, [auth, pathname, router, toast]);

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
      if (updatedFields.teamName && updatedFields.teamName !== user.teamName) {
        const teamMembersCount = allUsers.filter(u => u.teamName === updatedFields.teamName).length;
        if (teamMembersCount >= 4) {
          toast({
            variant: 'destructive',
            title: 'Team is Full',
            description: `The team "${updatedFields.teamName}" already has 4 members.`,
          });
          return;
        }
        updatedFields.teamJoinedAt = new Date();
      }
      if ('teamName' in updatedFields && !updatedFields.teamName) {
        updatedFields.teamJoinedAt = undefined;
      }
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
        if (user.teamName === teamName) {
            toast({ title: 'Already in Team', description: `You are already a member of team "${teamName}".` });
        } else {
            toast({ variant: 'destructive', title: 'Already in a Team', description: 'You must leave your current team before joining a new one.' });
        }
        return 'already_in_team';
    }
    const teamMembersCount = allUsers.filter(u => u.teamName === teamName).length;
    if (teamMembersCount >= 4) {
        toast({ variant: 'destructive', title: 'Team is Full', description: `The team "${teamName}" is full.` });
        return 'team_full';
    }
    updateUser({ teamName });
    toast({ title: 'Joined Team!', description: `You are now a member of "${teamName}".` });
    return 'success';
  };

  const hasUserJoinedTournament = (userId: string): boolean => {
    return allTransactions.some(tx => 
        tx.userId === userId && 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        tx.description.toLowerCase().startsWith('joined')
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

    // First, run checks for all users before making any changes
    for (const userToJoin of usersToJoin) {
        if (!userToJoin) {
            return 'not_logged_in';
        }
        if (userToJoin.isBlocked) {
            return { error: `Account is blocked and cannot join tournaments.`, user: userToJoin };
        }
        if (userToJoin.primaryGame !== tournament.gameName) {
            return { error: `Only ${tournament.gameName} players can join this tournament.`, user: userToJoin };
        }
        if (tournament.participants.some(p => p.user.id === userToJoin.id)) {
            return { error: `Already joined this tournament.`, user: userToJoin };
        }
        if (userToJoin.walletBalance < tournament.entryFee) {
            return { error: `Insufficient balance (needs ₹${tournament.entryFee}).`, user: userToJoin };
        }
    }
    
    if ((tournament.participants.length + usersToJoin.length) > tournament.slots) {
        return 'tournament_full';
    }

    let updatedUsers = [...allUsers];
    let updatedTransactions = [...allTransactions];
    
    const newParticipants: Participant[] = [];

    // All checks passed, now perform the updates
    for (const userToJoin of usersToJoin) {
        const isFirstTournament = !hasUserJoinedTournament(userToJoin.id);
        const updatedUser = { ...userToJoin, walletBalance: userToJoin.walletBalance - tournament.entryFee };

        // Deduct balance
        updatedUsers = updatedUsers.map(u => 
            u.id === userToJoin.id ? updatedUser : u
        );

        // Add transaction
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
        
        // Create participant record
        newParticipants.push({
            id: generateUniqueId(`p-${tournament.id}`, userToJoin.id),
            user: updatedUser,
            tournamentId: tournament.id,
            result: null,
            joinedAt: new Date(),
        });
        
        // Handle referral bonus for the referrer if it's the user's first tournament
        if (isFirstTournament && userToJoin.referredBy) {
            const referrer = updatedUsers.find(u => u.id === userToJoin.referredBy);
            if (referrer) {
                const storedSettings = localStorage.getItem('referralSettings');
                const settings: ReferralSettings = storedSettings ? JSON.parse(storedSettings) : { referralBonus: 25, newUserBonus: 25 };
                const bonus = settings.referralBonus;

                updatedUsers = updatedUsers.map(u => {
                    if (u.id === referrer.id) {
                        return { ...u, referralBalance: (u.referralBalance || 0) + bonus };
                    }
                    return u;
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
  };
  
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
    saveToStorage('supportTickets', updatedTickets, toast);
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

    saveToStorage('supportTickets', updatedTickets, toast);
    reload(); 
  };
  
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: Notification = {
          ...notification,
          id: generateUniqueId('notif', notification.userId),
          createdAt: new Date(),
          read: false,
      };
      const updatedNotifications = [newNotification, ...allNotifications];
      saveAllNotifications(updatedNotifications);
  };

  const markNotificationsAsRead = () => {
      if (!user) return;
      const hasUnread = notifications.some(n => !n.read);
      if (!hasUnread) return;

      const updatedNotifications = allNotifications.map(n => {
          if (n.userId === user.id) {
              return { ...n, read: true };
          }
          return n;
      });
      saveAllNotifications(updatedNotifications);
  };


  return (
    <UserContext.Provider value={{ user, setUser, transactions, allTransactions, tournaments, setTournaments, promotionalAds, setPromotionalAds, addTransaction, updateUser, joinTournament, login, signup, logout, reload, toast, referredUsers, hasUserJoinedTournament, moveReferralBonusToWallet, allUsers, addSupportTicket, addMessageToTicket, notifications, addNotification, markNotificationsAsRead, removeUserFromTeam, joinTeam }}>
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
