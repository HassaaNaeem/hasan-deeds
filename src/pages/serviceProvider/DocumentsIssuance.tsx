import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BentoCard, BentoCardHeader, BentoGrid } from '@/components/ui/bento-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlots } from '@/hooks/usePlots';
import { useGenerateMilestoneDocument } from '@/hooks/useMilestones';
import { useMilestoneDocuments, useUploadMilestoneDocument } from '@/hooks/useDocuments';
import { Loader2, FileText, CheckCircle2, Clock, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { MilestoneDocument } from '@/types/entities';

type DocumentType = 'ALLOTMENT' | 'ALLOCATION' | 'POSSESSION' | 'CLEARANCE';

const MILESTONE_DOCS: Record<number, { type: DocumentType; label: string; description: string }> = {
  10: { type: 'ALLOTMENT', label: 'Allotment Certificate', description: '10% payment milestone' },
  50: { type: 'ALLOCATION', label: 'Allocation Letter', description: '50% payment milestone' },
  75: { type: 'POSSESSION', label: 'Possession Certificate', description: '75% payment milestone' },
  100: { type: 'CLEARANCE', label: 'Clearance Certificate', description: '100% payment milestone' },
};

export default function DocumentsIssuance() {
  const { data: plotsResponse, isLoading: plotsLoading } = usePlots();
  const plots = plotsResponse?.data || [];

  const generateMutation = useGenerateMilestoneDocument();
  const uploadMutation = useUploadMilestoneDocument();

  // Track which plot's documents to show
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const { data: docsResponse, isLoading: docsLoading } = useMilestoneDocuments(selectedPlotId || '');

  console.log('[DOCS ISSUANCE] Selected Plot ID:', selectedPlotId);
  console.log('[DOCS ISSUANCE] Docs Response:', docsResponse);
  console.log('[DOCS ISSUANCE] Loading:', docsLoading);

  const milestoneDocuments = docsResponse?.data?.documents || [];

  console.log('[DOCS ISSUANCE] Milestone Documents:', milestoneDocuments);

  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    document?: MilestoneDocument;
    file?: File;
  }>({ open: false });

  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    document?: MilestoneDocument;
    notes: string;
  }>({ open: false, notes: '' });

  // New: Manual upload dialog for creating milestone docs
  const [manualUploadDialog, setManualUploadDialog] = useState<{
    open: boolean;
    milestone: number;
    documentType: 'ALLOTMENT' | 'ALLOCATION' | 'POSSESSION' | 'CLEARANCE';
    file?: File;
  }>({
    open: false,
    milestone: 10,
    documentType: 'ALLOTMENT'
  });

  // Filter for relevant plots
  const activePlots = plots.filter(p => p.status === 'reserved' || p.status === 'sold');

  const readyDocs = milestoneDocuments.filter(d => d.status === 'ready');
  const generatedDocs = milestoneDocuments.filter(d => d.status === 'generated');
  const approvedDocs = milestoneDocuments.filter(d => d.status === 'approved');

  console.log('[DOCS ISSUANCE] Ready Docs:', readyDocs);
  console.log('[DOCS ISSUANCE] Generated Docs:', generatedDocs);
  console.log('[DOCS ISSUANCE] Approved Docs:', approvedDocs);

  const handleGenerateDocument = async () => {
    if (!uploadDialog.document) return;

    try {
      await generateMutation.mutateAsync({
        plotId: uploadDialog.document.plotId,
        documentType: uploadDialog.document.documentType as DocumentType,
        milestone: uploadDialog.document.percentage,
      });
      toast.success(`${MILESTONE_DOCS[uploadDialog.document.percentage]?.label} generated successfully`);
      setUploadDialog({ open: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate document');
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadDialog.document || !uploadDialog.file) return;

    try {
      await uploadMutation.mutateAsync({
        plotId: uploadDialog.document.plotId,
        documentFile: uploadDialog.file,
        documentType: uploadDialog.document.documentType as DocumentType,
        milestone: uploadDialog.document.percentage,
      });
      toast.success(`${MILESTONE_DOCS[uploadDialog.document.percentage]?.label} uploaded successfully`);
      setUploadDialog({ open: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleApproveDocument = async () => {
    if (!approvalDialog.document) return;

    try {
      toast.success(`${MILESTONE_DOCS[approvalDialog.document.percentage]?.label} approved and marked for issuance`);
      setApprovalDialog({ open: false, notes: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve document');
    }
  };

  const handleManualUpload = async () => {
    if (!selectedPlotId || !manualUploadDialog.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        plotId: selectedPlotId,
        documentFile: manualUploadDialog.file,
        documentType: manualUploadDialog.documentType,
        milestone: manualUploadDialog.milestone,
      });

      toast.success(`${MILESTONE_DOCS[manualUploadDialog.milestone]?.label} uploaded successfully`);
      setManualUploadDialog({
        open: false,
        milestone: 10,
        documentType: 'ALLOTMENT',
        file: undefined
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  };

  if (plotsLoading) {
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
          <h1 className="text-2xl font-bold">Documents Issuance</h1>
          <p className="text-muted-foreground mt-1">
            Generate and approve milestone documents
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar - Plot List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <BentoCard className="h-full overflow-hidden flex flex-col">
              <BentoCardHeader title="Select Plot" subtitle={`${activePlots.length} active plots`} />
              <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2">
                {activePlots.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No active plots found.</p>
                ) : (
                  activePlots.map(plot => (
                    <div
                      key={plot._id}
                      onClick={() => {
                        console.log('[DOCS ISSUANCE] Plot selected:', plot._id, plot.plotNumber);
                        setSelectedPlotId(plot._id);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlotId === plot._id
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'hover:bg-muted/50 border-transparent hover:border-border'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">Plot {plot.plotNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${plot.status === 'sold' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>
                          {plot.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{plot.location}</p>
                    </div>
                  ))
                )}
              </div>
            </BentoCard>
          </div>

          {/* Main Content - Document Management */}
          <div className="lg:col-span-8 overflow-y-auto">
            {!selectedPlotId ? (
              <BentoCard className="h-full flex items-center justify-center flex-col text-center p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Plot Selected</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                  Select a plot from the sidebar to view milestones and manage document issuance.
                </p>
              </BentoCard>
            ) : docsLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <BentoCard className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-warning" />
                      <div>
                        <p className="text-xl font-bold">{readyDocs.length}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </BentoCard>
                  <BentoCard className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-xl font-bold">{approvedDocs.length}</p>
                        <p className="text-xs text-muted-foreground">Issued</p>
                      </div>
                    </div>
                  </BentoCard>
                </div>

                {/* Upload New Milestone Document */}
                <BentoCard className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Upload Milestone Document</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a new milestone document for this plot. It will be immediately issued to the purchaser.
                      </p>
                    </div>
                    <Button onClick={() => setManualUploadDialog({ ...manualUploadDialog, open: true })}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </BentoCard>

                {/* Ready for Generation */}
                {readyDocs.length > 0 && (
                  <BentoCard>
                    <BentoCardHeader title="Ready for Upload" subtitle="Documents triggered by payment milestones" />
                    <div className="divide-y divide-border">
                      {readyDocs.map((doc) => (
                        <div key={doc._id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{MILESTONE_DOCS[doc.percentage]?.label || 'Document'}</p>
                            <p className="text-sm text-muted-foreground">{MILESTONE_DOCS[doc.percentage]?.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">Milestone: {doc.percentage}% payment reached</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setUploadDialog({ open: true, document: doc })}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload PDF
                          </Button>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                )}

                {/* Approved Documents */}
                {approvedDocs.length > 0 && (
                  <BentoCard>
                    <BentoCardHeader title="Issued Documents" subtitle="Documents issued to purchaser" />
                    <div className="divide-y divide-border">
                      {approvedDocs.map((doc) => (
                        <div key={doc._id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{MILESTONE_DOCS[doc.percentage]?.label || 'Document'}</p>
                            <p className="text-sm text-success mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Issued on {new Date(doc.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.generatedUri || doc['uri' as keyof MilestoneDocument], '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </BentoCard>
                )}

                {milestoneDocuments.length === 0 && (
                  <BentoCard className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No documents to process. Milestone documents will appear here when payment milestones are reached.</p>
                  </BentoCard>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Generate Document Dialog */}
        <Dialog open={uploadDialog.open} onOpenChange={(open) => setUploadDialog({ ...uploadDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Milestone Document</DialogTitle>
              <DialogDescription>
                {uploadDialog.document && MILESTONE_DOCS[uploadDialog.document.percentage]?.label} - {uploadDialog.document?.percentage}% milestone
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Document Information</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Type: {uploadDialog.document?.documentType}</li>
                  <li>• Milestone: {uploadDialog.document?.percentage}%</li>
                  <li>• This document will be visible to the purchaser</li>
                </ul>
              </div>
              <div>
                <Label htmlFor="file-upload">Select PDF File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  className="mt-1"
                  onChange={(e) => setUploadDialog({
                    ...uploadDialog,
                    file: e.target.files?.[0]
                  })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialog({ open: false })}>
                Cancel
              </Button>
              <Button onClick={handleUploadDocument} disabled={uploadMutation.isPending || !uploadDialog.file}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Document</DialogTitle>
              <DialogDescription>
                Review and approve {approvalDialog.document && MILESTONE_DOCS[approvalDialog.document.percentage]?.label}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {(approvalDialog.document?.generatedUri || (approvalDialog.document as any)?.uri) && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Document Preview</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const uri = approvalDialog.document?.generatedUri || (approvalDialog.document as any)?.uri;
                      if (uri) window.open(String(uri), '_blank');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Open PDF in New Tab
                  </Button>
                </div>
              )}
              <div>
                <Label>Approval Notes (Optional)</Label>
                <Input
                  placeholder="Add any notes..."
                  value={approvalDialog.notes}
                  onChange={(e) => setApprovalDialog({ ...approvalDialog, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog({ ...approvalDialog, open: false })}>
                Cancel
              </Button>
              <Button onClick={handleApproveDocument}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve & Issue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Manual Upload Dialog */}
        <Dialog open={manualUploadDialog.open} onOpenChange={(open) => setManualUploadDialog({ ...manualUploadDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Milestone Document</DialogTitle>
              <DialogDescription>
                Manually upload a milestone document for this plot
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="milestone-select">Select Milestone</Label>
                <select
                  id="milestone-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  value={manualUploadDialog.milestone}
                  onChange={(e) => {
                    const milestone = parseInt(e.target.value);
                    const docInfo = MILESTONE_DOCS[milestone];
                    if (docInfo) {
                      setManualUploadDialog({
                        ...manualUploadDialog,
                        milestone: milestone,
                        documentType: docInfo.type
                      });
                    }
                  }}
                >
                  <option value={10}>10% - Allotment Certificate</option>
                  <option value={50}>50% - Allocation Letter</option>
                  <option value={75}>75% - Possession Certificate</option>
                  <option value={100}>100% - Clearance Certificate</option>
                </select>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Document Summary</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Type: {manualUploadDialog.documentType}</li>
                  <li>• Milestone: {manualUploadDialog.milestone}%</li>
                  <li>• Action: Will create and upload new document</li>
                </ul>
              </div>

              <div>
                <Label htmlFor="manual-file-upload">Select PDF File</Label>
                <Input
                  id="manual-file-upload"
                  type="file"
                  accept=".pdf"
                  className="mt-1"
                  onChange={(e) => setManualUploadDialog({
                    ...manualUploadDialog,
                    file: e.target.files?.[0]
                  })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setManualUploadDialog({ ...manualUploadDialog, open: false })}>
                Cancel
              </Button>
              <Button onClick={handleManualUpload} disabled={uploadMutation.isPending || !manualUploadDialog.file}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
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
