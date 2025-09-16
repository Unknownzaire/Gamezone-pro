









export type PrizeDistribution = {
  rank: string; // e.g., "1", "2", "3", "4-10"
  percentage: number; // e.g., 50 for 50%
};

export type PromotionalAd = {
  id: string;
  title: string;
  imageUrl: string;
  link: string; // URL to a tournament or external page
  status: 'active' | 'inactive';
};


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
  prizeDistribution?: PrizeDistribution[];
};

export type Participant = {
  id: string;
  user: User;
  tournamentId: string;
  result: 'Winner' | `Rank #${number}` | 'Participated' | null;
  joinedAt: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: Date;
  status: 'completed' | 'pending' | 'declined';
  declineReason?: string;
  paymentDetails?: {
    method: 'upi' | 'bank';
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  }
};

export type User = {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  avatarUrl: string;
  coverImageUrl?: string;
  mobile?: string;
  bgmiUsername?: string;
  bgmiId?: string;
  isBlocked?: boolean;
  createdAt: Date;
  totalDeposits?: number;
  referredBy?: string; // ID of the user who referred this user
  referralCode: string;
};

      