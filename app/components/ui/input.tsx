import * as React from "react"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", type, error, ...props }, ref) => {
        return (
            <div className="flex flex-col w-full relative">
                <input
                    type={type}
                    className={`flex h-12 w-full rounded-xl border border-panel-border bg-panel px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-alert focus-visible:ring-alert' : ''} ${type === 'number' ? 'font-mono' : ''} ${className}`}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <span className="text-alert text-xs mt-1 absolute -bottom-5 left-0">{error}</span>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
