import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plot, PlotDetails, ApiResponse } from '@/types/entities';

interface PlotsResponse {
    success: boolean;
    count: number;
    data: Plot[];
}

interface PlotStartApplicationResponse {
    success: boolean;
    message: string;
    data: {
        plot: Plot;
        plotDetails: PlotDetails;
        requiredDocuments: string[];
    };
}

export function usePlots(filters?: { status?: string; location?: string; area?: string }) {
    return useQuery({
        queryKey: ['plots', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.location) params.append('location', filters.location);
            if (filters?.area) params.append('area', filters.area);

            const response = await api.get<PlotsResponse>(`/plots?${params.toString()}`);
            return response.data;
        },
    });
}

export function useMyPlots() {
    return useQuery({
        queryKey: ['my-plots'],
        queryFn: async () => {
            // Backend returns structure: { plot: Plot, details: PlotDetails }[]
            const response = await api.get<ApiResponse<{ plot: Plot; details: PlotDetails }[]>>('/plots/my-plots');
            return response.data;
        },
    });
}

export function usePlot(plotId: string) {
    return useQuery({
        queryKey: ['plot', plotId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{ plot: Plot; plotDetails: PlotDetails }>>(`/plots/${plotId}`);
            return response.data;
        },
        enabled: !!plotId,
    });
}

export function useApplyPlot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (plotId: string) => {
            const response = await api.post<PlotStartApplicationResponse>(`/plots/${plotId}/apply`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plots'] });
            queryClient.invalidateQueries({ queryKey: ['my-plots'] });
        },
    });
}

// Service provider: Create new plot
export function useCreatePlot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: FormData | {
            plotNumber: string;
            area: string;
            location: string;
            totalValue: number;
            documentType?: string;
        }) => {
            const config = data instanceof FormData 
                ? { headers: { 'Content-Type': 'multipart/form-data' } }
                : undefined;
            const response = await api.post<ApiResponse<Plot>>('/plots', data, config);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plots'] });
        },
    });
}

// Service provider: Update plot
export function useUpdatePlot(plotId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Plot>) => {
            const response = await api.put<ApiResponse<Plot>>(`/plots/${plotId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plots'] });
            queryClient.invalidateQueries({ queryKey: ['plot', plotId] });
        },
    });
}
