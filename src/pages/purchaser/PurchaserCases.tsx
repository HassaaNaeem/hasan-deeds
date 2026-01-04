import { AppLayout } from '@/components/layout/AppLayout';
import { BentoCard, BentoCardHeader } from '@/components/ui/bento-grid';
import { useMockData } from '@/contexts/MockDataContext';
import { format } from 'date-fns';
import { Scroll, AlertCircle } from 'lucide-react';

export default function PurchaserCases() {
    const { getConsumerCases } = useMockData();
    const cases = getConsumerCases();

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Legal Cases</h1>
                    <p className="text-muted-foreground mt-1">
                        View legal proceedings filed against your plots
                    </p>
                </div>

                <div className="grid gap-6">
                    <BentoCard>
                        <BentoCardHeader
                            title="My Active Cases"
                            subtitle={`${cases.length} cases found`}
                        />
                        <div className="space-y-4">
                            {cases.length === 0 ? (
                                <p className="text-center py-12 text-muted-foreground">
                                    No legal cases found against your account.
                                </p>
                            ) : (
                                cases.map((c) => (
                                    <div key={c._id} className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wide">
                                                    {c.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                                <AlertCircle className="w-5 h-5 text-destructive" />
                                                Case #{c.caseId}
                                            </h3>
                                            <p className="text-muted-foreground mt-1">
                                                Filed against non-payment for <strong>{c.plotNumber}</strong>
                                            </p>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Amount</p>
                                                    <p className="font-medium mt-1">PKR {c.amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Legal Fees</p>
                                                    <p className="font-medium mt-1 text-destructive">PKR {c.amountCharged?.toLocaleString() ?? 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Court Date</p>
                                                    <p className="font-medium mt-1">{c.courtDate ? format(new Date(c.courtDate), 'MMM d, yyyy') : 'TBD'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Reference</p>
                                                    <p className="font-medium mt-1">{c.chargeCode}</p>
                                                </div>
                                            </div>

                                            {c.description && (
                                                <div className="mt-4 p-3 bg-background/50 rounded-lg border text-sm text-muted-foreground">
                                                    {c.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </BentoCard>
                </div>
            </div>
        </AppLayout>
    );
}
