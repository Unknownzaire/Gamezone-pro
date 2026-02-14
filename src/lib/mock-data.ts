
import { User, Tournament, Participant, Transaction } from './types';

const mockUsers: User[] = Array.from({ length: 100 }, (_, i) => {
  const gameId = `5${Math.floor(100000000 + Math.random() * 900000000)}`;
  return {
    id: `user-${i + 1}`,
    username: `Player${i + 1}`,
    email: `player${i + 1}@example.com`,
    password: 'password',
    walletBalance: 1500,
    referralBalance: i < 2 ? 50 : 0, // First two users have some referral balance
    avatarUrl: `https://picsum.photos/seed/u${i + 1}/100/100`,
    mobile: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    primaryGame: 'BGMI',
    inGameUsername: `Player${i + 1}BGMI`,
    inGameId: gameId,
    teamName: `Team ${i % 10 + 1}`,
    createdAt: new Date(new Date().getTime() - (100 - i) * 24 * 60 * 60 * 1000), // Staggered registration dates
    referredBy: i >= 95 ? 'user-1' : (i >= 90 ? 'user-2' : undefined), // Last 10 users were referred
    referralCode: gameId,
  }
});


export { mockUsers };


export const mockParticipants: Participant[] = [
    // Participants for t-2 (Live) - first 50 users
    ...mockUsers.slice(0, 50).map((user, index) => ({
      id: `p-t2-${index + 1}`,
      user,
      tournamentId: 't-2',
      result: null,
      joinedAt: new Date(new Date('2025-09-15T21:15:00Z').getTime() - (50-index) * 60000)
    })),
    // Participants for t-3 (Completed) - next 25 users
    ...mockUsers.slice(50, 75).map((user, index) => ({
      id: `p-t3-${index + 1}`,
      user,
      tournamentId: 't-3',
      result: index === 0 ? 'Winner' : 'Participated',
      joinedAt: new Date(new Date('2025-09-10T18:30:00Z').getTime() - (25-index) * 60000)
    })),
     // Participants for t-1 - user-1 joins
    {
      id: 'p-t1-1',
      user: mockUsers[0],
      tournamentId: 't-1',
      result: null,
      joinedAt: new Date('2025-09-16T10:00:00Z')
    },
     // user-96 (referred by user-1) joins a tournament
    {
      id: 'p-t1-96',
      user: mockUsers.find(u => u.id === 'user-96')!,
      tournamentId: 't-1',
      result: null,
      joinedAt: new Date('2025-09-16T11:00:00Z')
    },
    // Participants for t-6 (FREE FIRE Completed)
    ...mockUsers.slice(75, 85).map((user, index) => ({
      id: `p-t6-${index + 1}`,
      user,
      tournamentId: 't-6',
      result: index === 0 ? 'Winner' : 'Participated',
      joinedAt: new Date(new Date('2025-09-12T18:30:00Z').getTime() - (10-index) * 60000)
    })),
    // Participants for t-7 (COD Live)
    ...mockUsers.slice(85, 95).map((user, index) => ({
      id: `p-t7-${index + 1}`,
      user,
      tournamentId: 't-7',
      result: null,
      joinedAt: new Date(new Date('2025-09-16T14:00:00Z').getTime() - (10-index) * 60000)
    })),
];

export const mockTournaments: Tournament[] = [
  {
    id: 't-1',
    title: 'Sunrise Skirmish',
    gameName: 'BGMI',
    matchType: 'Solo',
    entryFee: 50,
    prizePool: 5000,
    matchTime: new Date('2025-09-17T19:30:00Z'),
    status: 'Upcoming',
    commissionPercentage: 10,
    participants: mockParticipants.filter(p => p.tournamentId === 't-1'),
    imageUrl: 'https://picsum.photos/seed/1/600/400',
    imageHint: 'sunrise battleground'
  },
  {
    id: 't-2',
    title: 'Midnight Mayhem',
    gameName: 'BGMI',
    matchType: 'Squad',
    entryFee: 100,
    prizePool: 10000,
    matchTime: new Date('2025-09-15T21:15:00Z'),
    status: 'Live',
    roomId: 'BGMI12345',
    roomPassword: 'GOFORIT',
    commissionPercentage: 15,
    participants: mockParticipants.filter(p => p.tournamentId === 't-2'),
    imageUrl: 'https://picsum.photos/seed/2/600/400',
    imageHint: 'night combat'
  },
  {
    id: 't-3',
    title: 'Victory Valley',
    gameName: 'BGMI',
    matchType: 'Duo',
    entryFee: 75,
    prizePool: 7500,
    matchTime: new Date('2025-09-10T18:30:00Z'),
    status: 'Completed',
    commissionPercentage: 12,
    participants: mockParticipants.filter(p => p.tournamentId === 't-3'),
    winner: mockUsers[50], // Winner is the first participant of t-3
    imageUrl: 'https://picsum.photos/seed/3/600/400',
    imageHint: 'victory landscape'
  },
  {
    id: 't-4',
    title: 'Elite Squads',
    gameName: 'BGMI',
    matchType: 'Squad',
    entryFee: 200,
    prizePool: 20000,
    matchTime: new Date('2025-09-22T16:00:00Z'),
    status: 'Upcoming',
    commissionPercentage: 10,
    participants: [],
    imageUrl: 'https://picsum.photos/seed/4/600/400',
    imageHint: 'team soldier'
  },
  {
    id: 't-5',
    title: 'Inferno Arena',
    gameName: 'FREE FIRE',
    matchType: 'Solo',
    entryFee: 25,
    prizePool: 2500,
    matchTime: new Date('2025-09-20T20:00:00Z'),
    status: 'Upcoming',
    commissionPercentage: 15,
    participants: [],
    imageUrl: 'https://picsum.photos/seed/5/600/400',
    imageHint: 'fire arena'
  },
  {
    id: 't-6',
    title: 'Coastal Clash',
    gameName: 'FREE FIRE',
    matchType: 'Duo',
    entryFee: 50,
    prizePool: 4000,
    matchTime: new Date('2025-09-12T18:30:00Z'),
    status: 'Completed',
    commissionPercentage: 10,
    participants: mockParticipants.filter(p => p.tournamentId === 't-6'),
    winner: mockUsers[75],
    imageUrl: 'https://picsum.photos/seed/6/600/400',
    imageHint: 'beach battle'
  },
  {
    id: 't-7',
    title: 'Urban Warfare',
    gameName: 'COD',
    matchType: 'Squad',
    entryFee: 150,
    prizePool: 15000,
    matchTime: new Date('2025-09-16T14:00:00Z'),
    status: 'Live',
    roomId: 'CODWAR',
    roomPassword: 'WARZONE',
    commissionPercentage: 10,
    participants: mockParticipants.filter(p => p.tournamentId === 't-7'),
    imageUrl: 'https://picsum.photos/seed/7/600/400',
    imageHint: 'city war'
  },
  {
    id: 't-8',
    title: 'Frostbite Ops',
    gameName: 'COD',
    matchType: 'Solo',
    entryFee: 100,
    prizePool: 8000,
    matchTime: new Date('2025-09-25T22:00:00Z'),
    status: 'Upcoming',
    commissionPercentage: 12,
    participants: [],
    imageUrl: 'https://picsum.photos/seed/8/600/400',
    imageHint: 'snow combat'
  },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx-2', userId: 'user-2', amount: 100, type: 'debit', description: 'Joined "Midnight Mayhem"', createdAt: new Date('2025-09-15T10:05:00Z'), status: 'completed' },
  { id: 'tx-3', userId: 'user-51', amount: 6600, type: 'credit', description: 'Prize from "Victory Valley"', createdAt: new Date('2025-09-10T20:00:00Z'), status: 'completed' },
  { id: 'tx-4', userId: 'user-51', amount: 75, type: 'debit', description: 'Joined "Victory Valley"', createdAt: new Date('2025-09-09T12:00:00Z'), status: 'completed' },
  { id: 'tx-5', userId: 'user-1', amount: 500, type: 'credit', description: 'Added to wallet', createdAt: new Date('2024-07-28T09:00:00Z'), status: 'completed' },
  { id: 'tx-6', userId: 'user-2', amount: 1000, type: 'credit', description: 'Prize from "Old Tournament"', createdAt: new Date('2024-07-20T18:00:00Z'), status: 'completed' },
  { id: 'tx-7', userId: 'user-2', amount: 200, type: 'credit', description: 'Referral Bonus', createdAt: new Date('2024-07-22T11:30:00Z'), status: 'completed' },
  { id: 'tx-8', userId: 'user-2', amount: 250, type: 'debit', description: 'Withdrawal from Bank', createdAt: new Date('2024-07-29T14:00:00Z'), status: 'pending' },
  { id: 'tx-9', userId: 'user-1', amount: 150, type: 'debit', description: 'Withdrawal to UPI', createdAt: new Date(), status: 'pending' },
].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
