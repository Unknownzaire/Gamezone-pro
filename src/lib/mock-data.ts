import { User, Tournament, Participant, Transaction } from './types';

export const mockUsers: User[] = [
  { id: 'user-1', username: 'PlayerOne', email: 'playerone@example.com', walletBalance: 500, avatarUrl: 'https://picsum.photos/seed/u1/100/100' },
  { id: 'user-2', username: 'ShadowStrike', email: 'shadow@example.com', walletBalance: 1200, avatarUrl: 'https://picsum.photos/seed/u2/100/100' },
  { id: 'user-3', username: 'NinjaGamer', email: 'ninja@example.com', walletBalance: 750, avatarUrl: 'https://picsum.photos/seed/u3/100/100' },
  { id: 'user-4', username: 'Phoenix', email: 'phoenix@example.com', walletBalance: 250, avatarUrl: 'https://picsum.photos/seed/u4/100/100' },
];

export const mockParticipants: Participant[] = [
    { id: 'p-1', user: mockUsers[0], tournamentId: 't-2', result: 'Participated', joinedAt: new Date('2024-08-01T10:00:00Z') },
    { id: 'p-2', user: mockUsers[1], tournamentId: 't-2', result: 'Participated', joinedAt: new Date('2024-08-01T10:05:00Z') },
    { id: 'p-3', user: mockUsers[2], tournamentId: 't-3', result: 'Winner', joinedAt: new Date('2024-07-20T12:00:00Z') },
    { id: 'p-4', user: mockUsers[3], tournamentId: 't-3', result: 'Participated', joinedAt: new Date('2024-07-20T12:05:00Z') },
    ...mockUsers.map((user, index) => ({
      id: `p-live-${index + 1}`,
      user,
      tournamentId: 't-2',
      result: null,
      joinedAt: new Date('2024-08-15T10:00:00Z')
    })),
];

export const mockTournaments: Tournament[] = [
  {
    id: 't-1',
    title: 'Sunrise Skirmish',
    gameName: 'BGMI',
    entryFee: 50,
    prizePool: 5000,
    matchTime: new Date('2025-09-17T14:00:00Z'),
    status: 'Upcoming',
    commissionPercentage: 10,
    participants: [],
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
    winner: mockUsers[2],
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
  { id: 'tx-1', userId: 'user-1', amount: 500, type: 'credit', description: 'Initial wallet load', createdAt: new Date('2024-07-28T09:00:00Z') },
  { id: 'tx-2', userId: 'user-2', amount: 100, type: 'debit', description: 'Joined Midnight Mayhem', createdAt: new Date('2024-08-01T10:05:00Z') },
  { id: 'tx-3', userId: 'user-3', amount: 6600, type: 'credit', description: 'Prize from Victory Valley', createdAt: new Date('2024-07-25T18:00:00Z') },
  { id: 'tx-4', userId: 'user-3', amount: 75, type: 'debit', description: 'Joined Victory Valley', createdAt: new Date('2024-07-20T12:00:00Z') },
];
