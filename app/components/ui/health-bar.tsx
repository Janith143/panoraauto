import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export interface HealthBarProps {
    currentSpan: number; // e.g. miles driven since last service
    maxSpan: number;    // e.g. total lifespan miles
    currentMonths?: number; // months since last service
    maxMonths?: number; // lifespan in months
    label?: string;
    className?: string;
    type?: 'linear' | 'circular';
}

const HealthBar = React.forwardRef<HTMLDivElement, HealthBarProps>(
    ({ currentSpan, maxSpan, currentMonths = 0, maxMonths = 0, label, className = "", type = 'linear' }, ref) => {

        // Km calculations
        const percentageUsedKm = maxSpan > 0 ? Math.min(100, Math.max(0, (currentSpan / maxSpan) * 100)) : 0;
        const percentageRemainingKm = maxSpan > 0 ? 100 - percentageUsedKm : null;

        // Month calculations
        const percentageUsedMonths = maxMonths > 0 ? Math.min(100, Math.max(0, (currentMonths / maxMonths) * 100)) : 0;
        const percentageRemainingMonths = maxMonths > 0 ? 100 - percentageUsedMonths : null;

        // Determine the controlling metric (whichever is closer to 0% remaining)
        let controllingPercentageRemaining = percentageRemainingKm;
        let controllingMetricLabel = "km";

        if (percentageRemainingMonths !== null) {
            if (controllingPercentageRemaining === null || percentageRemainingMonths < controllingPercentageRemaining) {
                controllingPercentageRemaining = percentageRemainingMonths;
                controllingMetricLabel = "mo";
            }
        }

        // Fallback to 100% if neither is tracked
        const displayPercentage = controllingPercentageRemaining !== null ? controllingPercentageRemaining : 100;

        // Determine color based on health remaining
        let barColor = "bg-success"; // Green when healthy
        let colorClass = "text-success";

        if (displayPercentage <= 25) {
            barColor = "bg-warning";  // Yellow when getting close
            colorClass = "text-warning";
        }
        if (displayPercentage <= 10) {
            barColor = "bg-alert";    // Red when critical/due
            colorClass = "text-alert";
        }

        // Build tooltip content
        let tooltipContent = null;
        if (maxSpan > 0 || maxMonths > 0) {
            tooltipContent = (
                <div className="text-xs space-y-1">
                    {maxSpan > 0 && (
                        <div>
                            <span className="font-semibold">{Math.max(0, maxSpan - currentSpan).toLocaleString()} km</span> left of {maxSpan.toLocaleString()} km
                        </div>
                    )}
                    {maxMonths > 0 && (
                        <div>
                            <span className="font-semibold">{Math.max(0, maxMonths - currentMonths).toFixed(1)} mo</span> left of {maxMonths} mo
                        </div>
                    )}
                </div>
            );
        }

        const renderCircular = () => {
            const radius = 35;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

            return (
                <div ref={ref} className={`flex flex-col items-center justify-center gap-2 ${className}`}>
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <svg className="transform -rotate-90 w-full h-full">
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-panel-border"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className={`${colorClass} transition-all duration-1000 ease-in-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className={`text-xl font-bold ${colorClass}`}>{displayPercentage.toFixed(0)}%</span>
                            {(maxSpan > 0 || maxMonths > 0) && (
                                <span className={`text-[10px] font-medium opacity-70 ${colorClass}`}>{controllingMetricLabel}</span>
                            )}
                        </div>
                    </div>
                    {label && <span className="text-sm font-medium text-foreground/80">{label}</span>}
                </div>
            )
        };

        const renderLinear = () => (
            <div ref={ref} className={`w-full flex flex-col gap-2 ${className}`}>
                {label && (
                    <div className="flex justify-between text-sm font-medium">
                        <span>{label}</span>
                        <span className={`${displayPercentage <= 10 ? 'text-alert' : 'text-foreground/70'}`}>
                            {displayPercentage.toFixed(0)}% ({controllingMetricLabel}) Left
                        </span>
                    </div>
                )}
                <div className="h-3 w-full bg-panel-border rounded-full overflow-hidden">
                    <div
                        className={`h-full ${barColor} transition-all duration-500 ease-in-out`}
                        style={{ width: `${displayPercentage}%` }}
                    />
                </div>
            </div>
        );

        if (tooltipContent) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {type === 'circular' ? renderCircular() : renderLinear()}
                        </TooltipTrigger>
                        <TooltipContent>
                            {tooltipContent}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return type === 'circular' ? renderCircular() : renderLinear();
    }
)
HealthBar.displayName = "HealthBar"

export { HealthBar }
