import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BentoCard, BentoCardHeader } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlots } from "@/hooks/usePlots";
import { useVerifyDocuments, usePlotDocuments } from "@/hooks/useDocuments";
import { useCreatePaymentSchedule } from "@/hooks/usePayments";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Trash2,
  FileText,
  ChevronRight,
  ExternalLink,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function PlotDocumentsView({ plotId }: { plotId: string }) {
  const { data: response, isLoading } = usePlotDocuments(plotId);
  const details = response?.data?.plotDetails;

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!details) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No documents found for this plot.
      </p>
    );
  }

  const docs = [
    { label: "CNIC Copy", uri: details.purchaserCnicCopyUri },
    { label: "Site Plan / Mpa", uri: details.plotMapUri },
    { label: "Bank Statement", uri: details.purchaserBankStatementUri },
    { label: "Company Form", uri: details.companyFormUri },
  ].filter((d) => d.uri);

  if (docs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Submitted Documents</Label>
      <div className="grid grid-cols-1 gap-2">
        {docs.map((doc, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
          >
            <span className="text-sm font-medium">{doc.label}</span>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(doc.uri, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View
            </Button> */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkQueue() {
  const { user } = useAuth();
  // Service providers need to see ALL reserved plots, not just their own
  // Use usePlots to get all reserved plots
  const { data: plotsResponse, isLoading } = usePlots({ status: "reserved" });
  const plots = plotsResponse?.data || [];

  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean;
    plotId?: string;
    plotNumber?: string;
    plotValue?: number;
  }>({ open: false });
  const [verifyStatus, setVerifyStatus] = useState<"verified" | "rejected">(
    "verified"
  );

  const [scheduleDialog, setScheduleDialog] = useState<{
    open: boolean;
    plotId?: string;
    plotNumber?: string;
    plotValue?: number;
  }>({ open: false });

  // Fixed milestones: 10%, 50%, 75%, 100%
  const MILESTONES = [
    { percentage: 10, label: "Allotment", docType: "ALLOTMENT" },
    { percentage: 50, label: "Allocation", docType: "ALLOCATION" },
    { percentage: 75, label: "Possession", docType: "POSSESSION" },
    { percentage: 100, label: "Clearance", docType: "CLEARANCE" },
  ];

  const [milestoneDueDates, setMilestoneDueDates] = useState<
    { percentage: number; dueDate: string; label: string; docType: string }[]
  >([]);

  const verifyMutation = useVerifyDocuments();
  const createScheduleMutation = useCreatePaymentSchedule();

  // Filter plots based on verification status
  const pendingPlots = plots.filter(
    (plot) => plot.plotDetails?.status !== "verified"
  );
  const verifiedPlots = plots.filter(
    (plot) => plot.plotDetails?.status === "verified"
  );

  const handleVerify = async () => {
    if (!verifyDialog.plotId || !user?.serviceProviderId) {
      toast.error("Missing required information");
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        plotId: verifyDialog.plotId,
        status: verifyStatus,
        serviceProviderId:
          typeof user.serviceProviderId === "string"
            ? user.serviceProviderId
            : user.serviceProviderId._id,
      });
      toast.success(
        `Documents ${
          verifyStatus === "verified" ? "verified" : "rejected"
        } successfully`
      );

      // If verified, show payment schedule dialog
      ///////////////////////////
      ///////////////////////////
      ///////////////////////////
      ///////////////////////////
      ///////////////////////////
      if (verifyStatus === "verified") {
        setScheduleDialog({
          open: true,
          plotId: verifyDialog.plotId,
          plotNumber: verifyDialog.plotNumber,
          plotValue: verifyDialog.plotValue,
        });
        setMilestoneDueDates(MILESTONES.map((m) => ({ ...m, dueDate: "" })));
      }

      setVerifyDialog({ open: false });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to verify documents"
      );
    }
  };

  const handleMilestoneDateChange = (index: number, dueDate: string) => {
    const updated = [...milestoneDueDates];
    updated[index].dueDate = dueDate;
    setMilestoneDueDates(updated);
  };

  const handleCreateSchedule = async () => {
    if (!scheduleDialog.plotId || !scheduleDialog.plotValue) {
      toast.error("Missing plot information");
      return;
    }

    const missingDates = milestoneDueDates.some((m) => !m.dueDate);
    if (missingDates) {
      toast.error("All milestone due dates are required");
      return;
    }

    try {
      const scheduleData = {
        plotId: scheduleDialog.plotId,
        installments: milestoneDueDates.map((m, idx) => ({
          installmentNumber: idx + 1,
          amount: Math.round((scheduleDialog.plotValue! * m.percentage) / 100),
          dueDate: m.dueDate,
        })),
      };

      await createScheduleMutation.mutateAsync(scheduleData);
      toast.success(
        "Payment schedule created successfully! Document generation will trigger at each milestone."
      );
      setScheduleDialog({ open: false });
      setMilestoneDueDates([]);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create payment schedule"
      );
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Work Queue</h1>
          <p className="text-muted-foreground mt-1">
            Verify documents and manage plot applications
          </p>
        </div>

        <BentoCard
          className="bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => (window.location.href = "/service-provider/documents")}
        >
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Manage Milestone Documents
                </h3>
                <p className="text-sm text-muted-foreground">
                  Issue allotment, allocation, and possession documents for
                  active plots
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </BentoCard>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Verification ({pendingPlots.length})
            </TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <BentoCard>
              <BentoCardHeader title="Pending Document Verification" />
              {pendingPlots.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No pending verifications
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {pendingPlots.map((plot) => (
                    <div
                      key={plot._id}
                      className="py-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">Plot {plot.plotNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {plot.location}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Area: {plot.area} • Value: PKR{" "}
                          {plot.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        <Button
                          size="sm"
                          onClick={() =>
                            setVerifyDialog({
                              open: true,
                              plotId: plot._id,
                              plotNumber: plot.plotNumber,
                              plotValue: plot.totalValue,
                            })
                          }
                        >
                          Review Documents
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BentoCard>
          </TabsContent>

          <TabsContent value="verified" className="mt-4">
            <BentoCard>
              <BentoCardHeader
                title="Verified Plots"
                subtitle="Applications with verified documents"
              />
              {verifiedPlots.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No verified plots found
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {verifiedPlots.map((plot) => (
                    <div
                      key={plot._id}
                      className="py-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">Plot {plot.plotNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {plot.location}
                        </p>
                        <p className="text-sm text-success mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Documents
                          Verified
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/service-provider/documents?plotId=${plot._id}`,
                              "_self"
                            )
                          }
                        >
                          Manage Documents
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BentoCard>
          </TabsContent>
        </Tabs>

        {/* Verify Dialog */}
        <Dialog
          open={verifyDialog.open}
          onOpenChange={(open) => setVerifyDialog({ open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Documents</DialogTitle>
              <DialogDescription>
                Review and verify documents for Plot {verifyDialog.plotNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {verifyDialog.plotId && (
                <PlotDocumentsView plotId={verifyDialog.plotId} />
              )}

              <div className="pt-4 border-t">
                <Label>Verification Decision</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={
                      verifyStatus === "verified" ? "default" : "outline"
                    }
                    className="flex-1"
                    onClick={() => setVerifyStatus("verified")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={
                      verifyStatus === "rejected" ? "destructive" : "outline"
                    }
                    className="flex-1"
                    onClick={() => setVerifyStatus("rejected")}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setVerifyDialog({ open: false })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Verification"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Schedule Dialog */}
        <Dialog
          open={scheduleDialog.open}
          onOpenChange={(open) => setScheduleDialog({ open: false })}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Create Payment Schedule
              </DialogTitle>
              <DialogDescription>
                Set up installment milestones for Plot{" "}
                {scheduleDialog.plotNumber}
                <div className="mt-2 text-sm font-medium text-foreground">
                  Total Plot Value: PKR{" "}
                  {scheduleDialog.plotValue?.toLocaleString()}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                {milestoneDueDates.map((milestone, index) => (
                  <div key={index} className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        {milestone.percentage}% - {milestone.label}
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        (Auto Doc: {milestone.docType})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Amount
                        </Label>
                        <div className="mt-1 p-2 rounded bg-muted/50 text-sm font-medium">
                          PKR{" "}
                          {scheduleDialog.plotValue
                            ? Math.round(
                                (scheduleDialog.plotValue *
                                  milestone.percentage) /
                                  100
                              ).toLocaleString()
                            : "0"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Due Date *</Label>
                        <Input
                          type="date"
                          value={milestone.dueDate}
                          onChange={(e) =>
                            handleMilestoneDateChange(index, e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                <p className="text-xs text-info">
                  ℹ When the purchaser reaches each milestone payment, a
                  corresponding document will be automatically generated and
                  prepared for your review.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setScheduleDialog({ open: false })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSchedule}
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
