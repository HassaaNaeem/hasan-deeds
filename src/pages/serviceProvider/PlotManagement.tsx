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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePlots, useCreatePlot } from '@/hooks/usePlots';
import { Loader2, Plus, MapPin, Maximize2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function PlotManagement() {
    const { data: plotsResponse, isLoading } = usePlots();
    const plots = plotsResponse?.data || [];
    const createPlotMutation = useCreatePlot();

    const [createDialog, setCreateDialog] = useState(false);
    const [plotData, setPlotData] = useState({
        plotNumber: '',
        area: '',
        location: '',
        totalValue: '',
        documentType: '',
        plotImage: undefined as File | undefined,
    });

    const handleCreatePlot = async () => {
        if (!plotData.plotNumber || !plotData.area || !plotData.location || !plotData.totalValue) {
            toast.error('Please fill in all required fields');
            return;
        }

        const formData = new FormData();
        formData.append('plotNumber', plotData.plotNumber);
        formData.append('area', plotData.area);
        formData.append('location', plotData.location);
        formData.append('totalValue', plotData.totalValue);
        if (plotData.documentType) formData.append('documentType', plotData.documentType);
        if (plotData.plotImage) formData.append('plotImage', plotData.plotImage);

        try {
            await createPlotMutation.mutateAsync(formData);
            toast.success('Plot created successfully');
            setCreateDialog(false);
            setPlotData({
                plotNumber: '',
                area: '',
                location: '',
                totalValue: '',
                documentType: '',
                plotImage: undefined,
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create plot');
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

    const availablePlots = plots.filter(p => p.status === 'available');
    const reservedPlots = plots.filter(p => p.status === 'reserved');
    const soldPlots = plots.filter(p => p.status === 'sold');

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Plot Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage plots for purchasers
                        </p>
                    </div>
                    <Button onClick={() => setCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Plot
                    </Button>
                </div>

                {/* Stats */}
                <BentoGrid columns={4}>
                    <BentoCard>
                        <div className="text-center">
                            <p className="text-3xl font-bold">{plots.length}</p>
                            <p className="text-sm text-muted-foreground mt-1">Total Plots</p>
                        </div>
                    </BentoCard>
                    <BentoCard>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-success">{availablePlots.length}</p>
                            <p className="text-sm text-muted-foreground mt-1">Available</p>
                        </div>
                    </BentoCard>
                    <BentoCard>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-warning">{reservedPlots.length}</p>
                            <p className="text-sm text-muted-foreground mt-1">Reserved</p>
                        </div>
                    </BentoCard>
                    <BentoCard>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{soldPlots.length}</p>
                            <p className="text-sm text-muted-foreground mt-1">Sold</p>
                        </div>
                    </BentoCard>
                </BentoGrid>

                {/* All Plots */}
                <BentoCard>
                    <BentoCardHeader title="All Plots" subtitle={`${plots.length} total`} />
                    {plots.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No plots created yet</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {plots.map((plot) => (
                                <div key={plot._id} className="py-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium">Plot {plot.plotNumber}</p>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {plot.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Maximize2 className="w-3 h-3" />
                                                {plot.area}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                PKR {plot.totalValue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${plot.status === 'available'
                                                    ? 'bg-success/10 text-success'
                                                    : plot.status === 'reserved'
                                                        ? 'bg-warning/10 text-warning'
                                                        : plot.status === 'sold'
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {plot.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </BentoCard>

                {/* Create Plot Dialog */}
                <Dialog open={createDialog} onOpenChange={setCreateDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Plot</DialogTitle>
                            <DialogDescription>
                                Add a new plot to the system for purchasers to apply
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="plotNumber">Plot Number *</Label>
                                <Input
                                    id="plotNumber"
                                    value={plotData.plotNumber}
                                    onChange={(e) => setPlotData({ ...plotData, plotNumber: e.target.value })}
                                    placeholder="e.g., P-001"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                    id="location"
                                    value={plotData.location}
                                    onChange={(e) => setPlotData({ ...plotData, location: e.target.value })}
                                    placeholder="e.g., Hasan Gardens Phase 1"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="area">Area *</Label>
                                <Input
                                    id="area"
                                    value={plotData.area}
                                    onChange={(e) => setPlotData({ ...plotData, area: e.target.value })}
                                    placeholder="e.g., 10 marla"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="totalValue">Total Value (PKR) *</Label>
                                <Input
                                    id="totalValue"
                                    type="number"
                                    value={plotData.totalValue}
                                    onChange={(e) => setPlotData({ ...plotData, totalValue: e.target.value })}
                                    placeholder="e.g., 5000000"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="documentType">Document Type</Label>
                                <Input
                                    id="documentType"
                                    value={plotData.documentType}
                                    onChange={(e) => setPlotData({ ...plotData, documentType: e.target.value })}
                                    placeholder="e.g., Freehold"
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="plotImage">Plot Image</Label>
                                <Input
                                    id="plotImage"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPlotData({ ...plotData, plotImage: e.target.files?.[0] })}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreatePlot} disabled={createPlotMutation.isPending}>
                                {createPlotMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Plot'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
