import { Timestamp } from 'firebase/firestore';

export interface User {
    uid: string;
    userName: string;
    email: string;
    avatarUrl?: string | null;
    preferences: {
        watchlistSubscriptions?: WatchlistSubscription[] | null;
        investments?: Investment[] | null;
        websiteCurrencyBalance: number;
        profitIndex: number;
        theme: string;
    };
    isAdmin: boolean;
    isBanned: boolean;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface CryptoCurrency {
    id: string;
    name: string;
    symbol: string;
    exchangeCurrency: string;
}

export interface WatchlistSubscription {
    id: string;
    cryptoCurrencyId: string;
}

export interface Investment {
    id: string;
    cryptoCurrencyId: string;
    userId: string;
    amount: number;
    buyingPrice: number;
    sellingPrice: number | null;
    isSold: boolean | null;
    description: string;
    soldAt: Timestamp | null;
    createdAt: Timestamp;
}

export interface PriceAlert {
    id: string;
    cryptoCurrencyId: string;
    userId: string;
    alertPrice: number;
    description: string;
    type: 'above' | 'below';
    isActive: boolean;
    createdAt: Timestamp;
}