import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PlotDetails, ApiResponse, MilestoneDocument } from '@/types/entities';

// Get documents for a specific plot
export function usePlotDocuments(plotId: string) {
    return useQuery({
        queryKey: ['plot-documents', plotId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{ plot: any; plotDetails: PlotDetails }>>(`/plots/${plotId}`);
            return response.data;
        },
        enabled: !!plotId,
    });
}

// Upload plot documents (purchaser)
export function useUploadPlotDocuments(plotId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (files: {
            plotMap?: File;
            cnicCopy?: File;
            bankStatement?: File;
            companyForm?: File;
        }) => {
            const formData = new FormData();

            if (files.plotMap) formData.append('plotMap', files.plotMap);
            if (files.cnicCopy) formData.append('cnicCopy', files.cnicCopy);
            if (files.bankStatement) formData.append('bankStatement', files.bankStatement);
            if (files.companyForm) formData.append('companyForm', files.companyForm);

            const response = await api.post<ApiResponse<PlotDetails>>(
                `/plots/${plotId}/documents`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plot-documents', plotId] });
            queryClient.invalidateQueries({ queryKey: ['my-plots'] });
            queryClient.invalidateQueries({ queryKey: ['plot', plotId] });
        },
    });
}

// Get all documents for purchaser's plots
export function useMyDocuments() {
    return useQuery({
        queryKey: ['my-documents'],
        queryFn: async () => {
            // Use my-plots endpoint and extract documents
            const response = await api.get<ApiResponse<{ plot: any; details: PlotDetails }[]>>('/plots/my-plots');
            return response.data;
        },
    });
}

// Verify documents (service provider)
export function useVerifyDocuments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { plotId: string; status: 'verified' | 'rejected'; serviceProviderId: string }) => {
            const response = await api.put<ApiResponse<PlotDetails>>(`/plots/${data.plotId}/verify`, {
                status: data.status,
                serviceProviderId: data.serviceProviderId
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['plot-documents', variables.plotId] });
            queryClient.invalidateQueries({ queryKey: ['plot', variables.plotId] });
            queryClient.invalidateQueries({ queryKey: ['my-plots'] });
            queryClient.invalidateQueries({ queryKey: ['plots'] });
        },
    });
}

// ========== MILESTONE DOCUMENT ENDPOINTS ==========

/**
 * Get all milestone documents for a plot
 * Called by: Purchaser (view own documents) or SP (view assigned documents)
 */
export function useMilestoneDocuments(plotId: string) {
    console.log('[useMilestoneDocuments] Hook called with plotId:', plotId);

    return useQuery({
        queryKey: ['milestone-documents', plotId],
        queryFn: async () => {
            console.log('[useMilestoneDocuments] Fetching from API:', `/documents/${plotId}`);
            const response = await api.get<ApiResponse<{
                plot: { _id: string; plotNumber: string };
                documents: MilestoneDocument[];
                plotDetails: PlotDetails;
            }>>(`/documents/${plotId}`);
            console.log('[useMilestoneDocuments] API Response:', response.data);
            return response.data;
        },
        enabled: !!plotId,
    });
}

/**
 * Upload a milestone document (SP uploads after payment milestone reached)
 * Called by: Service Provider in DocumentsIssuance page
 */
export function useUploadMilestoneDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            plotId: string;
            documentFile: File;
            documentType: 'ALLOTMENT' | 'ALLOCATION' | 'POSSESSION' | 'CLEARANCE';
            milestone: number;
        }) => {
            const formData = new FormData();
            formData.append('document', data.documentFile);
            formData.append('documentType', data.documentType);
            formData.append('milestone', data.milestone.toString());

            const response = await api.post<ApiResponse<MilestoneDocument>>(
                `/documents/${data.plotId}/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['milestone-documents', variables.plotId] });
            queryClient.invalidateQueries({ queryKey: ['plot-documents', variables.plotId] });
            queryClient.invalidateQueries({ queryKey: ['plot', variables.plotId] });
        },
    });
}

/**
 * Download/preview milestone document
 * Called by: Purchaser or SP to get document URI and metadata
 */
export function useMilestoneDocumentDownload(documentId: string) {
    return useQuery({
        queryKey: ['milestone-document', documentId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{
                documentId: string;
                documentType: string;
                percentage: number;
                uri: string;
                status: string;
                approvedAt?: string;
            }>>(`/documents/${documentId}/download`);
            return response.data;
        },
        enabled: !!documentId,
    });
}
