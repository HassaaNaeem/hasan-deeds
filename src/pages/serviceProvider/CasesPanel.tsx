import { AppLayout } from '@/components/layout/AppLayout';
import { BentoCard, BentoCardHeader } from '@/components/ui/bento-grid';
import { Button } from '@/components/ui/button';
import { useMockData } from '@/contexts/MockDataContext';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Scale, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CasesPanel() {
  const { failedPayments, fileCase } = useMockData();
  
  // In mock mode, we treat failedPayments as 'cases' source
  const cases = failedPayments;

  const [fileDialog, setFileDialog] = useState<{
    open: boolean;
    failedPaymentId?: string;
  }>({ open: false });
  const [caseData, setCaseData] = useState({
    courtDate: '',
    chargeCode: '',
    amountCharged: '',
    description: '',
  });

  const [isFiling, setIsFiling] = useState(false);

  const handleFileCase = async () => {
    if (!fileDialog.failedPaymentId) return;

    setIsFiling(true);
    // Simulate API delay
    setTimeout(() => {
        try {
            fileCase(fileDialog.failedPaymentId!, {
                ...caseData,
                amountCharged: parseFloat(caseData.amountCharged),
            });
            toast.success('Case filed successfully');
            setFileDialog({ open: false });
            setCaseData({ courtDate: '', chargeCode: '', amountCharged: '', description: '' });
        } catch (error: any) {
            toast.error('Failed to file case');
        } finally {
            setIsFiling(false);
        }
    }, 1000);
  };

  const recordedCases = cases.filter(c => c.status === 'recorded');
  const filedCases = cases.filter(c => c.status === 'filed' || c.status === 'in_progress');
  const resolvedCases = cases.filter(c => c.status === 'resolved' || c.status === 'closed');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cases Panel (Mock)</h1>
          <p className="text-muted-foreground mt-1">
            Manage legal cases for failed payments (Demonstration Mode)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recorded Cases */}
          <BentoCard>
            <BentoCardHeader
              title="Recorded Failed Payments"
              subtitle={`${recordedCases.length} pending filing`}
            />
            <div className="space-y-3">
              {recordedCases.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No recorded cases</p>
              ) : (
                recordedCases.map((c) => (
                  <div key={c._id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">PKR {c.amount.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="w-3 h-3"/> {c.purchaserName}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Plot: {c.plotNumber}
                        </p>
                        <p className="text-xs text-destructive mt-1">
                          Grace ends: {format(new Date(c.gracePeriodEnd), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setFileDialog({ open: true, failedPaymentId: c._id })}
                    >
                      <Scale className="w-3 h-3 mr-1" />
                      File Case
                    </Button>
                  </div>
                ))
              )}
            </div>
          </BentoCard>

          {/* Filed Cases */}
          <BentoCard>
            <BentoCardHeader
              title="Active Cases"
              subtitle={`${filedCases.length} in progress`}
            />
            <div className="space-y-3">
              {filedCases.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No active cases</p>
              ) : (
                filedCases.map((c) => (
                  <div key={c._id} className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                    <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">Case #{c.caseId}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">{c.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Against: {c.purchaserName} ({c.plotNumber})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Amount: PKR {c.amount.toLocaleString()} + {c.amountCharged?.toLocaleString()} (Fees)
                    </p>
                    {c.courtDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Court: {format(new Date(c.courtDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </BentoCard>

          {/* Resolved Cases */}
          <BentoCard>
            <BentoCardHeader
              title="Resolved Cases"
              subtitle={`${resolvedCases.length} completed`}
            />
            <div className="space-y-3">
              {resolvedCases.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No resolved cases</p>
              ) : (
                resolvedCases.map((c) => (
                  <div key={c._id} className="p-3 rounded-lg border border-success/20 bg-success/5">
                    <p className="font-medium text-sm">Case #{c.caseId}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Amount: PKR {c.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-success mt-1">{c.status}</p>
                  </div>
                ))
              )}
            </div>
          </BentoCard>
        </div>

        {/* File Case Dialog */}
        <Dialog open={fileDialog.open} onOpenChange={(open) => setFileDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File Legal Case</DialogTitle>
              <DialogDescription>
                Enter case details to file with the court. This will mark the plot as ON HOLD.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="courtDate">Court Date</Label>
                <Input
                  id="courtDate"
                  type="date"
                  value={caseData.courtDate}
                  onChange={(e) => setCaseData({ ...caseData, courtDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="chargeCode">Charge Code</Label>
                <Input
                  id="chargeCode"
                  value={caseData.chargeCode}
                  onChange={(e) => setCaseData({ ...caseData, chargeCode: e.target.value })}
                  placeholder="e.g., FP-2024-001"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="amountCharged">Legal Fees / Charges (PKR)</Label>
                <Input
                  id="amountCharged"
                  type="number"
                  value={caseData.amountCharged}
                  onChange={(e) => setCaseData({ ...caseData, amountCharged: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={caseData.description}
                  onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFileDialog({ open: false })}>
                Cancel
              </Button>
              <Button onClick={handleFileCase} disabled={isFiling}>
                {isFiling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Filing...
                  </>
                ) : (
                  'File Case & Hold Plot'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
