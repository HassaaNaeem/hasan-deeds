import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BentoGrid, BentoCard, BentoCardHeader } from '@/components/ui/bento-grid';
import { MilestoneProgress } from '@/components/ui/milestone-progress';
import { PlotCard } from '@/components/cards/PlotCard';
import { PaymentCard } from '@/components/cards/PaymentCard';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, TrendingUp, FileText, CreditCard,
  CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMyPlots } from '@/hooks/usePlots';
import { useMyPayments } from '@/hooks/usePayments';
import { PaymentInstallment, PaymentSchedule } from '@/types/entities';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function PurchaserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: plotsData, isLoading: plotsLoading } = useMyPlots();
  const { data: paymentsData, isLoading: paymentsLoading } = useMyPayments();

  const purchaserPlots = plotsData?.data || [];

  // Flatten payments to find upcoming ones
  const allInstallments = paymentsData?.data?.flatMap(item =>
    item.installments.map(inst => ({
      ...inst,
      scheduleId: item.schedule._id,
      installmentNumber: item.schedule.installmentNumber // This logic might need refinement if schedule.installmentNumber is total count?
      // Wait, PaymentSchedule has "installmentNumber". If that's the count, we don't know THIS installment's number unless we deduce index.
      // But let's assume item.installments is ordered 0..N
      // We can map with index:
    }))
  ) || [];

  // Re-map with index if needed, or rely on installment not having it.
  // Actually, let's map carefully.
  const flatPayments = paymentsData?.data?.flatMap(item =>
    item.installments.map((inst, index) => ({
      ...inst,
      schedule: item.schedule,
      calculatedInstallmentNumber: index // Assuming 0-indexed order matches installment # (0 = down payment?)
    }))
  ) || [];

  const upcomingPayments = flatPayments
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Calculate statistics
  const totalPlots = purchaserPlots.length;
  // totalValue sum
  const totalValue = purchaserPlots.reduce((sum, p) => sum + p.plot.totalValue, 0);
  const activePayments = flatPayments.filter(i => i.status === 'pending' || i.status === 'overdue').length;

  // Get featured plot (first one)
  const featuredPlotData = purchaserPlots[0];
  const featuredPlot = featuredPlotData?.plot;
  const featuredDetails = featuredPlotData?.details;

  // Mock milestone calculation for now as it requires complex logic not fully in entity yet
  // Or we can calculate based on payments if we have them for this plot.
  const getMilestone = (plotId: string) => {
    // Simple mock logic or 0 if no payments
    return { percentage: 25, level: 10 as any };
  };
  const featuredMilestone = featuredPlot ? getMilestone(featuredPlot._id) : { percentage: 0, level: 0 };

  const getUserName = () => {
    if (!user) return 'User';
    if (typeof user.purchaserId === 'object' && user.purchaserId !== null && 'name' in user.purchaserId) return user.purchaserId.name;
    if (typeof user.serviceProviderId === 'object' && user.serviceProviderId !== null && 'name' in user.serviceProviderId) return user.serviceProviderId.name;
    return user.email.split('@')[0];
  }

  // Get user image
  // const getUserImage = () => {
  //   if (!user) return undefined;
  //   let uri = '';

  //   if (user.purchaserId && typeof user.purchaserId !== 'string' && user.purchaserId?.imageUri) {
  //     uri = user.purchaserId.imageUri;
  //   } else if (user.serviceProviderId && typeof user.serviceProviderId !== 'string' && user.serviceProviderId?.imageUri) {
  //     uri = user.serviceProviderId.imageUri;
  //   }

  //   if (uri) {
  //     if (uri.startsWith('http')) return uri;
  //     const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3002';
  //     console.log(baseUrl)
  //     console.log(uri)
  //     return `${baseUrl}/${uri}`;
  //   }
  //   return undefined;
  // };

  const getUserImage = () => {
  if (!user) return undefined;
  let uri = '';

  if (user.purchaserId && typeof user.purchaserId !== 'string' && user.purchaserId?.imageUri) {
    uri = user.purchaserId.imageUri;
  } else if (user.serviceProviderId && typeof user.serviceProviderId !== 'string' && user.serviceProviderId?.imageUri) {
    uri = user.serviceProviderId.imageUri;
  }

  if (uri) {
    if (uri.startsWith('http')) return uri;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3002';
    
    // Remove leading slash from uri if it exists to avoid double slashes
    const cleanUri = uri.startsWith('/') ? uri.slice(1) : uri;
    const fullUrl = `${baseUrl}/${cleanUri}`;
    
    console.log('Full image URL:', fullUrl);
    return fullUrl;
  }
  return undefined;
};

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (plotsLoading || paymentsLoading) {
    return <AppLayout><div className="p-8">Loading dashboard...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/10">
              <AvatarImage src={getUserImage()} className="object-cover" />
              <AvatarFallback className="text-lg bg-primary/5 text-primary">
                {getInitials(getUserName())}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {getUserName().split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's an overview of your plots and payments
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/purchaser/plots')}>
            Apply for New Plot
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Stats Cards */}
        <BentoGrid columns={4}>
          <BentoCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPlots}</p>
                <p className="text-sm text-muted-foreground">Active Plots</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(totalValue / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-sm text-muted-foreground">Total Investment</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePayments}</p>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">25%</p>
                <p className="text-sm text-muted-foreground">Avg. Completion</p>
              </div>
            </div>
          </BentoCard>
        </BentoGrid>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured Plot - Milestone Progress */}
          <div className="lg:col-span-2">
            {featuredPlot && (
              <BentoCard className="h-full">
                <BentoCardHeader
                  title={`Plot ${featuredPlot.plotNumber}`}
                  subtitle={featuredPlot.location}
                  action={
                    <StatusBadge variant="active">
                      {featuredMilestone.percentage}% Complete
                    </StatusBadge>
                  }
                />

                {/* Milestone Progress */}
                <div className="mb-6">
                  <MilestoneProgress
                    percentage={featuredMilestone.percentage}
                    milestoneLevel={featuredMilestone.level as any}
                    size="lg"
                  />
                </div>

                {/* Milestone Steps */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { level: 10, label: 'Allotment', doc: featuredDetails?.allotmentDocUri },
                    { level: 50, label: 'Allocation', doc: featuredDetails?.allocationDocUri },
                    { level: 75, label: 'Possession', doc: featuredDetails?.possessionDocUri },
                    { level: 100, label: 'Clearance', doc: featuredDetails?.clearanceDocUri },
                  ].map((m) => {
                    // Check if level reached (mock logic for now, should be real)
                    const isCompleted = featuredMilestone.percentage >= m.level;
                    const hasDoc = !!m.doc;
                    return (
                      <div
                        key={m.level}
                        className={`p-3 rounded-lg border text-center ${isCompleted ? 'bg-accent/10 border-accent' : 'bg-muted/50 border-border'
                          }`}
                      >
                        <p className={`text-xs font-medium ${isCompleted ? 'text-accent' : 'text-muted-foreground'}`}>
                          {m.level}%
                        </p>
                        <p className="text-sm font-medium mt-1">{m.label}</p>
                        {isCompleted && hasDoc && (
                          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-accent">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </div>
                        )}
                        {!isCompleted && (
                          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Pending
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/purchaser/documents')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Documents
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate('/purchaser/payments')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Make Payment
                  </Button>
                </div>
              </BentoCard>
            )}
          </div>

          {/* Upcoming Payments */}
          <div>
            <BentoCard className="h-full">
              <BentoCardHeader
                title="Upcoming Payments"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/purchaser/payments')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                }
              />

              <div className="space-y-3">
                {upcomingPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending payments</p>
                  </div>
                ) : (
                  upcomingPayments.map((payment) => {
                    // Find plot for this payment
                    const plotData = purchaserPlots.find(p => p.plot._id === payment.schedule.plotId);
                    return (
                      <PaymentCard
                        key={payment._id}
                        installment={payment}
                        installmentNumber={payment.calculatedInstallmentNumber}
                        plotNumber={plotData?.plot.plotNumber}
                        onPayNow={() => navigate('/purchaser/payments')}
                      />
                    );
                  })
                )}
              </div>
            </BentoCard>
          </div>
        </div>

        {/* My Plots Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Plots</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/purchaser/plots')}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <BentoGrid columns={3}>
            {purchaserPlots.map((plotData) => (
              <PlotCard
                key={plotData.plot._id}
                plot={plotData.plot}
                onClick={() => navigate(`/purchaser/plots/${plotData.plot._id}`)}
              />
            ))}
          </BentoGrid>
        </div>
      </div>
    </AppLayout>
  );
}
