import { User, Tournament, Participant, Transaction } from './types';

export const mockUsers: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: `user-${i + 1}`,
  username: `Player${i + 1}`,
  email: `player${i + 1}@example.com`,
  walletBalance: Math.floor(Math.random() * 2000) + 50,
  avatarUrl: `https://picsum.photos/seed/u${i + 1}/100/100`,
  mobile: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  bgmiUsername: `Player${i + 1}BGMI`,
  bgmiId: `5${Math.floor(100000000 + Math.random() * 900000000)}`,
}));


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
    }
];

export const mockTournaments: Tournament[] = [
  {
    id: 't-1',
    title: 'Sunrise Skirmish',
    gameName: 'BGMI',
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
    entryFee: 200,
    prizePool: 20000,
    matchTime: new Date('2025-09-22T16:00:00Z'),
    status: 'Upcoming',
    commissionPercentage: 10,
    participants: [],
    imageUrl: 'https://picsum.photos/seed/4/600/400',
    imageHint: 'team soldier'
  },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', userId: 'user-1', amount: 500, type: 'credit', description: 'Added to wallet', createdAt: new Date('2024-07-28T09:00:00Z'), status: 'completed' },
  { id: 'tx-2', userId: 'user-1', amount: 100, type: 'debit', description: 'Joined "Midnight Mayhem"', createdAt: new Date('2025-09-15T10:05:00Z'), status: 'completed' },
  { id: 'tx-3', userId: 'user-51', amount: 6600, type: 'credit', description: 'Prize from "Victory Valley"', createdAt: new Date('2025-09-10T20:00:00Z'), status: 'completed' },
  { id: 'tx-4', userId: 'user-51', amount: 75, type: 'debit', description: 'Joined "Victory Valley"', createdAt: new Date('2025-09-09T12:00:00Z'), status: 'completed' },
  { id: 'tx-5', userId: 'user-1', amount: 50, type: 'debit', description: 'Joined "Sunrise Skirmish"', createdAt: new Date('2025-09-16T10:00:00Z'), status: 'completed' },
  { id: 'tx-6', userId: 'user-1', amount: 1000, type: 'credit', description: 'Prize from "Old Tournament"', createdAt: new Date('2024-07-20T18:00:00Z'), status: 'completed' },
  { id: 'tx-7', userId: 'user-1', amount: 200, type: 'credit', description: 'Referral Bonus', createdAt: new Date('2024-07-22T11:30:00Z'), status: 'completed' },
  { id: 'tx-8', userId: 'user-1', amount: 250, type: 'credit', description: 'Withdrawal from Bank', createdAt: new Date('2024-07-29T14:00:00Z'), status: 'pending' },
].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
