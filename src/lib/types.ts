export type Tournament = {
  id: string;
  title: string;
  gameName: string;
  entryFee: number;
  prizePool: number;
  matchTime: Date;
  roomId?: string;
  roomPassword?: string;
  status: 'Upcoming' | 'Live' | 'Completed';
  commissionPercentage: number;
  participants: Participant[];
  winner?: User;
  imageUrl: string;
  imageHint: string;
};

export type Participant = {
  id: string;
  user: User;
  tournamentId: string;
  result: 'Winner' | 'Participated' | null;
  joinedAt: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: Date;
  status: 'completed' | 'pending';
};

export type User = {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  avatarUrl: string;
  mobile?: string;
  bgmiUsername?: string;
  bgmiId?: string;
};
