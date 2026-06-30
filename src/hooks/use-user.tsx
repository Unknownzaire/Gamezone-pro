'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { User, Transaction, Tournament, PromotionalAd, Participant, SupportTicket, SupportTicketMessage, Notification, GameProfile, RedeemCode, SocialLink } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import type { ReferralSettings, WalletSettings, HelpAndSupportSettings } from '@/app/admin/settings/page';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  runTransaction,
  arrayUnion,
  getDocs,
  getDoc
} from 'firebase/firestore';

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
  walletSettings: WalletSettings | null;
  referralSettings: ReferralSettings | null;
  helpAndSupportSettings: HelpAndSupportSettings | null;
  socialMediaLinks: SocialLink[];
  gameList: string[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  joinTournament: (tournamentId: string, usersToJoin: User[]) => Promise<JoinTournamentResult | JoinTournamentFailure>;
  joinTeam: (teamName: string) => Promise<'success' | 'already_in_team' | 'team_full' | 'error'>;
  login: (email: string) => Promise<boolean | 'blocked'>;
  signup: (userDetails: Omit<User, 'id' | 'walletBalance' | 'avatarUrl' | 'isBlocked' | 'createdAt' | 'password' | 'referralBalance' | 'youtubeUrl' | 'instagramUrl' | 'discordUrl' | 'emailVerified' | 'mobileVerified' | 'teamJoinedAt' | 'gameProfiles'> & {inGameUsername?: string, inGameId?: string}, password: string | undefined, emailVerified: boolean, mobileVerified: boolean, referralCode?: string) => Promise<"success" | "error">;
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
  redeemCode: (code: string) => Promise<'success' | 'invalid' | 'already_used' | 'error'>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { firestore, user: authUser, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Core Data Listeners
  const userRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userData } = useDoc<User>(userRef);

  const tournamentsRef = useMemoFirebase(() => collection(firestore, 'tournaments'), [firestore]);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsRef);

  const adsRef = useMemoFirebase(() => collection(firestore, 'promotional_ads'), [firestore]);
  const { data: adsData } = useCollection<PromotionalAd>(adsRef);

  const allUsersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: allUsersData } = useCollection<User>(allUsersRef);

  const userTransactionsQuery = useMemoFirebase(() => 
    authUser ? query(collection(firestore, 'users', authUser.uid, 'transactions'), orderBy('createdAt', 'desc')) : null, 
    [firestore, authUser]
  );
  const { data: userTransactions } = useCollection<Transaction>(userTransactionsQuery);

  const notificationsQuery = useMemoFirebase(() => 
    authUser ? query(collection(firestore, 'users', authUser.uid, 'notifications'), orderBy('createdAt', 'desc')) : null, 
    [firestore, authUser]
  );
  const { data: notificationsData } = useCollection<Notification>(notificationsQuery);

  // 2. Settings Listeners
  const walletSettingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'wallet'), [firestore]);
  const { data: walletSettings } = useDoc<WalletSettings>(walletSettingsRef);

  const referralSettingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'referral'), [firestore]);
  const { data: referralSettings } = useDoc<ReferralSettings>(referralSettingsRef);

  const helpSettingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'help'), [firestore]);
  const { data: helpSettings } = useDoc<HelpAndSupportSettings>(helpSettingsRef);

  const socialLinksRef = useMemoFirebase(() => doc(firestore, 'settings', 'social'), [firestore]);
  const { data: socialLinksData } = useDoc<{ links: SocialLink[] }>(socialLinksRef);

  const gamesListRef = useMemoFirebase(() => doc(firestore, 'settings', 'games'), [firestore]);
  const { data: gamesListData } = useDoc<{ list: string[] }>(gamesListRef);

  // 3. Functions
  const login = async (email: string): Promise<boolean | 'blocked'> => {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      try {
        const docSnap = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (docSnap.exists()) {
          const u = docSnap.data() as User;
          if (u.isBlocked) return 'blocked';
          return true;
        }
      } catch (e) {
        console.error("Login verification error:", e);
      }
    }

    // Fallback: check allUsersData if document fetch fails or is pending
    if (allUsersData) {
      const userToLogin = allUsersData.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (userToLogin) {
        if (userToLogin.isBlocked) return 'blocked';
        return true;
      }
    }
    return false;
  };

  const signup = async (userDetails: any, password: string | undefined, emailVerified: boolean, mobileVerified: boolean, referralCode?: string): Promise<"success" | "error"> => {
    if (!firestore) return 'error';
    
    let newUserBonus = 0;
    let referredBy: string | null = null;
    if (referralCode && referralSettings) {
        const referrer = allUsersData?.find(u => u.referralCode === referralCode);
        if (referrer) {
            referredBy = referrer.id;
            newUserBonus = referralSettings.newUserBonus;
        }
    }

    const referralCodeGenerated = Math.floor(100000 + Math.random() * 900000).toString();
    const newUserId = userDetails.googleId || auth?.currentUser?.uid || doc(collection(firestore, 'users')).id;

    const newUser: User = {
        id: newUserId,
        username: userDetails.username,
        email: userDetails.email,
        mobile: userDetails.mobile || null,
        primaryGame: userDetails.primaryGame || 'BGMI',
        referralCode: referralCodeGenerated,
        googleId: userDetails.googleId || null,
        password: password || null,
        walletBalance: newUserBonus,
        referralBalance: 0,
        avatarUrl: `https://picsum.photos/seed/${userDetails.username}/100/100`,
        isBlocked: false,
        createdAt: new Date(),
        referredBy: referredBy || null,
        emailVerified,
        mobileVerified,
        gameProfiles: (userDetails.primaryGame && userDetails.inGameUsername && userDetails.inGameId) ? {
          [userDetails.primaryGame]: {
            inGameUsername: userDetails.inGameUsername,
            inGameId: userDetails.inGameId,
          }
        } : {},
    };

    try {
        await setDoc(doc(firestore, 'users', newUserId), newUser);
        if (newUserBonus > 0) {
            await addDoc(collection(firestore, 'users', newUserId, 'transactions'), {
                amount: newUserBonus,
                type: 'credit',
                description: `Sign-up bonus (referred)`,
                createdAt: Timestamp.now(),
                status: 'completed',
                userId: newUserId
            });
        }
        return 'success';
    } catch (e) {
        console.error("Signup Firestore error:", e);
        return 'error';
    }
  };

  const logout = useCallback(() => {
    if (!auth) return;
    signOut(auth).then(() => {
      router.push('/login');
    });
  }, [auth, router]);

  const addTransaction = (tx: any) => {
    if (!authUser) return;
    addDoc(collection(firestore, 'users', authUser.uid, 'transactions'), {
      ...tx,
      userId: authUser.uid,
      createdAt: Timestamp.now(),
    });
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!authUser) return;
    updateDoc(doc(firestore, 'users', authUser.uid), updatedFields);
  };

  const joinTournament = async (tournamentId: string, usersToJoin: User[]): Promise<JoinTournamentResult | JoinTournamentFailure> => {
    if (!firestore || !tournamentsData) return false;
    const tournament = tournamentsData.find(t => t.id === tournamentId);
    if (!tournament) return false;

    try {
      await runTransaction(firestore, async (transaction) => {
        const tRef = doc(firestore, 'tournaments', tournamentId);
        const tSnap = await transaction.get(tRef);
        if (!tSnap.exists()) throw new Error("Tournament not found");
        
        const tData = tSnap.data() as Tournament;
        if ((tData.participants.length + usersToJoin.length) > tData.slots) {
            throw new Error("tournament_full");
        }

        const newParticipants: Participant[] = [];
        for (const utj of usersToJoin) {
            const uRef = doc(firestore, 'users', utj.id);
            const uSnap = await transaction.get(uRef);
            if (!uSnap.exists()) throw new Error(`User ${utj.username} not found`);
            
            const uData = uSnap.data() as User;
            if (uData.walletBalance < tournament.entryFee) {
                throw new Error(`insufficient_funds:${utj.username}`);
            }

            transaction.update(uRef, { walletBalance: uData.walletBalance - tournament.entryFee });
            
            const txRef = doc(collection(firestore, 'users', utj.id, 'transactions'));
            transaction.set(txRef, {
                amount: tournament.entryFee,
                type: 'debit',
                description: `Joined "${tournament.title}"`,
                createdAt: Timestamp.now(),
                status: 'completed',
                userId: utj.id
            });

            newParticipants.push({
                id: `${tournamentId}-${utj.id}-${Date.now()}`,
                user: { ...uData, walletBalance: uData.walletBalance - tournament.entryFee },
                tournamentId,
                result: null,
                joinedAt: new Date(),
            } as Participant);
        }

        transaction.update(tRef, { 
            participants: [...tData.participants, ...newParticipants] 
        });
      });
      return 'success';
    } catch (e: any) {
        if (e.message === 'tournament_full') return 'tournament_full';
        if (e.message.startsWith('insufficient_funds')) {
            const username = e.message.split(':')[1];
            return { error: 'Insufficient balance', user: usersToJoin.find(u => u.username === username)! };
        }
        return false;
    }
  };

  const joinTeam = async (teamName: string) => {
    if (!userData) return 'error';
    if (userData.teamName) return 'already_in_team';
    
    const teamMembers = allUsersData?.filter(u => u.teamName === teamName) || [];
    if (teamMembers.length >= 4) return 'team_full';

    await updateDoc(doc(firestore, 'users', userData.id), { teamName, teamJoinedAt: Timestamp.now() });
    return 'success';
  };

  const redeemCode = async (code: string): Promise<'success' | 'invalid' | 'already_used' | 'error'> => {
    if (!userData || !firestore) return 'error';

    try {
        const codesRef = collection(firestore, 'redeem_codes');
        const q = query(codesRef, where('code', '==', code.toUpperCase()));
        const querySnap = await getDocs(q);
        
        if (querySnap.empty) return 'invalid';
        
        const codeDoc = querySnap.docs[0];
        const codeData = codeDoc.data() as RedeemCode;
        
        if (codeData.usedCount >= codeData.usageLimit) return 'invalid';
        if (codeData.usedBy?.includes(userData.id)) return 'already_used';

        await runTransaction(firestore, async (transaction) => {
            const uRef = doc(firestore, 'users', userData.id);
            const cRef = doc(firestore, 'redeem_codes', codeDoc.id);
            
            const userSnap = await transaction.get(uRef);
            if (!userSnap.exists()) throw new Error("User missing");
            
            const codeSnap = await transaction.get(cRef);
            if (!codeSnap.exists()) throw new Error("Code missing");
            
            const finalUserData = userSnap.data() as User;
            const finalCodeData = codeSnap.data() as RedeemCode;
            
            transaction.update(uRef, { walletBalance: finalUserData.walletBalance + finalCodeData.amount });
            transaction.update(cRef, {
                usedCount: finalCodeData.usedCount + 1,
                usedBy: arrayUnion(userData.id)
            });
            
            const txRef = doc(collection(firestore, 'users', userData.id, 'transactions'));
            transaction.set(txRef, {
                amount: finalCodeData.amount,
                type: 'credit',
                description: `Voucher Redeem: ${code.toUpperCase()}`,
                createdAt: Timestamp.now(),
                status: 'completed',
                userId: userData.id
            });
        });
        
        return 'success';
    } catch (e) {
        console.error(e);
        return 'error';
    }
  };

  const addSupportTicket = (message: string, imageUrl?: string) => {
    if (!userData) return;
    addDoc(collection(firestore, 'support'), {
      userId: userData.id,
      subject: message.substring(0, 50),
      status: 'open',
      createdAt: Timestamp.now(),
      messages: [{
        sender: 'user',
        text: message,
        createdAt: Timestamp.now(),
        imageUrl: imageUrl || null
      }]
    });
  };

  const addMessageToTicket = (ticketId: string, message: string, imageUrl?: string) => {
    updateDoc(doc(firestore, 'support', ticketId), {
      status: 'open',
      messages: arrayUnion({
        sender: 'user',
        text: message,
        createdAt: Timestamp.now(),
        imageUrl: imageUrl || null
      })
    });
  };

  const moveReferralBonusToWallet = async () => {
    if (!userData || !userData.referralBalance || userData.referralBalance <= 0) return;
    const bonus = userData.referralBalance;
    
    await runTransaction(firestore, async (transaction) => {
        const uRef = doc(firestore, 'users', userData.id);
        transaction.update(uRef, {
            walletBalance: userData.walletBalance + bonus,
            referralBalance: 0
        });
        const txRef = doc(collection(firestore, 'users', userData.id, 'transactions'));
        transaction.set(txRef, {
            amount: bonus,
            type: 'credit',
            description: 'Referral earnings moved to wallet',
            createdAt: Timestamp.now(),
            status: 'completed',
            userId: userData.id
        });
    });
  };

  const hasUserJoinedTournament = (userId: string): boolean => {
    return userTransactions?.some(tx => 
        tx.type === 'debit' && 
        tx.status === 'completed' &&
        tx.description.startsWith('Joined "')
    ) || false;
  };

  const addNotification = (notif: any) => {
    addDoc(collection(firestore, 'users', notif.userId, 'notifications'), {
        ...notif,
        createdAt: Timestamp.now(),
        read: false
    });
  };

  const markNotificationsAsRead = () => {
    if (!userData || !notificationsData) return;
    notificationsData.filter(n => !n.read).forEach(n => {
        updateDoc(doc(firestore, 'users', userData.id, 'notifications', n.id), { read: true });
    });
  };

  const removeUserFromTeam = (userId: string) => {
    updateDoc(doc(firestore, 'users', userId), { teamName: null, teamJoinedAt: null });
  };

  const value = {
    user: userData || null,
    setUser: () => {}, 
    transactions: userTransactions || [],
    allTransactions: [], 
    tournaments: tournamentsData || [],
    setTournaments: () => {},
    promotionalAds: adsData || [],
    setPromotionalAds: () => {},
    referredUsers: allUsersData?.filter(u => u.referredBy === authUser?.uid) || [],
    allUsers: allUsersData || [],
    notifications: notificationsData || [],
    walletSettings: walletSettings || null,
    referralSettings: referralSettings || null,
    helpAndSupportSettings: helpSettings || null,
    socialMediaLinks: socialLinksData?.links || [],
    gameList: gamesListData?.list || ['BGMI', 'FREE FIRE', 'COD'],
    addTransaction,
    updateUser,
    joinTournament,
    joinTeam,
    login,
    signup,
    logout,
    reload: () => {}, 
    toast,
    hasUserJoinedTournament,
    moveReferralBonusToWallet,
    addSupportTicket,
    addMessageToTicket,
    addNotification,
    markNotificationsAsRead,
    removeUserFromTeam,
    redeemCode
  };

  return (
    <UserContext.Provider value={value}>
      {children}
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