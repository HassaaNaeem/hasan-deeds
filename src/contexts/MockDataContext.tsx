import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePlots } from '@/hooks/usePlots';
import { useAuth } from '@/contexts/AuthContext';

// Mock Interfaces matching the backend structures roughly
export interface MockFailedPayment {
    _id: string;
    plotId: string;
    plotNumber: string;
    purchaserId: string;
    purchaserName: string;
    amount: number;
    gracePeriodEnd: string;
    status: 'recorded' | 'filed' | 'in_progress' | 'resolved' | 'closed';
    caseId?: string;
    courtDate?: string;
    chargeCode?: string;
    amountCharged?: number;
    description?: string;
}

export interface MockPlot {
    _id: string;
    plotNumber: string;
    status: 'available' | 'reserved' | 'sold' | 'on_hold';
}

interface MockDataContextType {
    failedPayments: MockFailedPayment[];
    fileCase: (paymentId: string, caseDetails: { courtDate: string, chargeCode: string, amountCharged: number, description: string }) => void;
    getConsumerCases: () => MockFailedPayment[];
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: ReactNode }) {
    const { data: plotsResponse } = usePlots();
    const { user } = useAuth();
    const realPlots = plotsResponse?.data || [];

    // Local state to store cases/failed payments
    // We initialize this based on the fetched real plots
    const [failedPayments, setFailedPayments] = useState<MockFailedPayment[]>([]);

    useEffect(() => {
        if (realPlots.length > 0) {
            // Find plots that are sold or reserved to create mock failed payments against
            // only if we haven't already populated them to avoid overwriting user changes on re-fetch
            setFailedPayments(prev => {
                if (prev.length > 0) return prev; // Don't reset if we have data

                const activePlots = realPlots.filter(p => p.status === 'reserved' || p.status === 'sold');
                
                return activePlots.map((p, index) => {
                    const purchaser = p.purchaserId as any; // Handle populated field
                    return {
                        _id: `fp-${p._id}`,
                        plotId: p._id,
                        plotNumber: p.plotNumber,
                        purchaserId: purchaser?._id || 'unknown',
                        purchaserName: purchaser?.name || 'Unknown Purchaser',
                        amount: Math.round(p.totalValue * 0.1), // Mock 10% installment fail
                        gracePeriodEnd: new Date(Date.now() - 86400000 * (index + 1)).toISOString(), // Staggered dates
                        status: 'recorded' as const
                    };
                });
            });
        }
    }, [realPlots]);

    const fileCase = (paymentId: string, caseDetails: { courtDate: string, chargeCode: string, amountCharged: number, description: string }) => {
        setFailedPayments(prev => prev.map(fp => {
            if (fp._id === paymentId) {
                return {
                    ...fp,
                    status: 'filed',
                    ...caseDetails,
                    caseId: `CASE-${Date.now().toString().slice(-6)}`
                };
            }
            return fp;
        }));
    };

    const getConsumerCases = () => {
        if (!user || user.role !== 'purchaser') return [];

        // Get the current purchaser's ID safely
        const myPurchaserId = user.purchaserId && typeof user.purchaserId === 'object' 
            ? (user.purchaserId as any)._id 
            : user.purchaserId;
            
        // Filter cases that belong to this purchaser and differ from 'recorded' (meaning filed/active)
        // OR show 'recorded' ones too if we want them to see pending dues? 
        // User asked for "case filed", so normally 'filed', 'in_progress', 'resolved'.
        // But for demo visibility, let's show all that are handled effectively. 
        // Actually, just filtering by ID is good, but usually 'recorded' is internal to SP.
        // Let's show only 'filed', 'in_progress', 'resolved', 'closed'.
        return failedPayments.filter(fp => 
            fp.purchaserId === myPurchaserId && 
            fp.status !== 'recorded'
        );
    };

    return (
        <MockDataContext.Provider value={{ failedPayments, fileCase, getConsumerCases }}>
            {children}
        </MockDataContext.Provider>
    );
}

export function useMockData() {
    const context = useContext(MockDataContext);
    if (context === undefined) {
        throw new Error('useMockData must be used within a MockDataProvider');
    }
    return context;
}
