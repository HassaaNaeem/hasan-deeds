import { AppLayout } from '@/components/layout/AppLayout';
import { BentoCard, BentoCardHeader } from '@/components/ui/bento-grid';
import { UploadedDocumentCard } from '@/components/cards/DocumentCard';
import { MilestoneProgress } from '@/components/ui/milestone-progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useMyDocuments, useMilestoneDocuments } from '@/hooks/useDocuments';
import { usePaymentProgress } from '@/hooks/usePayments';
import { FolderOpen, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
const MILESTONE_LABELS: Record<number, string> = {
  10: 'Allotment Letter',
  50: 'Allocation Document',
  75: 'Possession Certificate',
  100: 'Clearance Certificate',
};

interface PlotDocumentCardProps {
  plotId: string;
  plotNumber: string;
  location: string;
  details: any;
  onViewDocument: (documentId: string, fallbackUri?: string) => void;
}

function PlotDocumentCard({ plotId, plotNumber, location, details, onViewDocument }: PlotDocumentCardProps) {
  // Hooks called at component level (not in map)
  const { data: progressData } = usePaymentProgress(plotId);
  const { data: milestoneData, isLoading: milestonesLoading } = useMilestoneDocuments(plotId);

  const paymentPercentage = progressData?.data?.percentage || 0;
  const milestoneDocuments = milestoneData?.data?.documents || [];
  const visibleDocs = milestoneDocuments.filter(d => d.status === 'approved' || d.status === 'generated');

  return (
    <BentoCard>
      <BentoCardHeader
        title={`Plot ${plotNumber}`}
        subtitle={location}
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {paymentPercentage}% Paid
            </span>
          </div>
        }
      />

      {/* Milestone Progress */}
      <div className="mb-6">
        <MilestoneProgress
          percentage={paymentPercentage as any}
          milestoneLevel={paymentPercentage as any}
          size="md"
        />
      </div>

      <Tabs defaultValue="issued" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="issued">Milestone Documents ({visibleDocs.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="issued" className="mt-4">
          <div className="space-y-3">
            {milestonesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : visibleDocs.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Documents related to your payment milestones
                </p>
                {visibleDocs.map((doc) => (
                  <UploadedDocumentCard
                    key={doc._id}
                    title={MILESTONE_LABELS[doc.percentage] || 'Document'}
                    fileName={doc.generatedUri?.split('/').pop() || 'document.pdf'}
                    uploadedAt={new Date(doc.approvedAt || doc.createdAt).toLocaleDateString()}
                    status={doc.status === 'approved' ? 'verified' : 'uploaded'}
                    onView={() => onViewDocument(doc._id, doc.generatedUri)}
                  />
                ))}
              </>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  No milestone documents issued yet. They will be generated as you reach payment milestones.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submitted" className="mt-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Documents you've submitted for verification
            </p>

            {details?.purchaserCnicCopyUri && (
              <UploadedDocumentCard
                title="CNIC Copy"
                fileName="cnic_copy.pdf"
                uploadedAt={new Date(details.updatedAt).toLocaleDateString()}
                status={details.status === 'verified' ? 'verified' : details.status === 'rejected' ? 'rejected' : 'uploaded'}
                onView={() => onViewDocument('', details.purchaserCnicCopyUri!)}
              />
            )}

            {details?.purchaserBankStatementUri && (
              <UploadedDocumentCard
                title="Bank Statement"
                fileName="bank_statement.pdf"
                uploadedAt={new Date(details.updatedAt).toLocaleDateString()}
                status={details.status === 'verified' ? 'verified' : details.status === 'rejected' ? 'rejected' : 'uploaded'}
                onView={() => onViewDocument('', details.purchaserBankStatementUri!)}
              />
            )}

            {details?.companyFormUri && (
              <UploadedDocumentCard
                title="Company Form"
                fileName="company_form.pdf"
                uploadedAt={new Date(details.updatedAt).toLocaleDateString()}
                status={details.status === 'verified' ? 'verified' : details.status === 'rejected' ? 'rejected' : 'uploaded'}
                onView={() => onViewDocument('', details.companyFormUri!)}
              />
            )}

            {details?.plotMapUri && (
              <UploadedDocumentCard
                title="Plot Map"
                fileName="plot_map.pdf"
                uploadedAt={new Date(details.updatedAt).toLocaleDateString()}
                status={details.status === 'verified' ? 'verified' : details.status === 'rejected' ? 'rejected' : 'uploaded'}
                onView={() => onViewDocument('', details.plotMapUri!)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </BentoCard>
  );
}

export default function PurchaserDocuments() {
  const { data: documentsResponse, isLoading: docsLoading } = useMyDocuments();
  const plotDocuments = documentsResponse?.data || [];

  const handleViewDocument = async (documentId: string, fallbackUri?: string) => {
    try {
      // Try to get fresh signed URL/metadata first
      const response = await import('@/lib/api').then(m => m.api.get<{ data: { uri: string } }>(`/documents/${documentId}/download`));
      if (response.data?.data?.uri) {
        window.open(response.data.data.uri, '_blank');
        return;
      }
    } catch (error) {
      console.warn('Failed to get download URL, trying fallback', error);
    }

    // Fallback to strict URI if available
    if (fallbackUri) {
      window.open(fallbackUri, '_blank');
    }
  };

  if (docsLoading) {
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Document Center</h1>
          <p className="text-muted-foreground mt-1">
            Access and manage all your plot-related documents
          </p>
        </div>

        {/* Documents by Plot */}
        {plotDocuments.map(({ plot, details }) => (
          <PlotDocumentCard
            key={plot._id}
            plotId={plot._id}
            plotNumber={plot.plotNumber}
            location={plot.location}
            details={details}
            onViewDocument={handleViewDocument}
          />
        ))}

        {/* No plots state */}
        {plotDocuments.length === 0 && (
          <BentoCard className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-lg font-semibold">No Documents Yet</h2>
            <p className="text-muted-foreground mt-2">
              Apply for a plot to start receiving documents
            </p>
          </BentoCard>
        )}
      </div>
    </AppLayout>
  );
}
