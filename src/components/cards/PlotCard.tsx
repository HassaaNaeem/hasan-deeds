import { MapPin, Maximize2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plot } from '@/types/entities';
import { StatusBadge, getPlotStatusVariant } from '@/components/ui/status-badge';
import { MilestoneProgress } from '@/components/ui/milestone-progress';
import { Button } from '@/components/ui/button';

interface PlotCardProps {
  plot: Plot;
  onClick?: () => void;
  showMilestone?: boolean;
  milestonePercentage?: number;
  className?: string;
}

export function PlotCard({ plot, onClick, showMilestone = true, milestonePercentage = 0, className }: PlotCardProps) {
  const milestone = { percentage: milestonePercentage, level: milestonePercentage as 0 | 10 | 50 | 75 | 100 };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `PKR ${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `PKR ${(price / 100000).toFixed(1)} Lac`;
    }
    return `PKR ${price.toLocaleString()}`;
  };

  const statusLabels: Record<string, string> = {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Sold',
    on_hold: 'On Hold',
  };

  const getImageUrl = (uri?: string) => {
    if (!uri) return undefined;
    if (uri.startsWith('http')) return uri;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3002';
    const cleanUri = uri.startsWith('/') ? uri.slice(1) : uri;
    return `${baseUrl}/${cleanUri}`;
  };

  return (
    <div
      className={cn(
        'bento-card group',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Plot Image */}
      {plot.imageUri && (
        <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-muted">
          <img 
            src={getImageUrl(plot.imageUri)} 
            alt={`Plot ${plot.plotNumber}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            {plot.plotNumber}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {plot.location}
          </div>
        </div>
        <StatusBadge variant={getPlotStatusVariant(plot.status)}>
          {statusLabels[plot.status]}
        </StatusBadge>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Area</p>
            <p className="text-sm font-medium">{plot.area}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-sm font-medium">{formatPrice(plot.totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Hover Action */}
      {onClick && (
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </div>
      )}
    </div>
  );
}
