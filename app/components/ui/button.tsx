import * as React from "react"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'alert' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = 'primary', size = 'default', ...props }, ref) => {

        let baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

        let variantStyles = "";
        if (variant === 'primary') variantStyles = "bg-primary text-white hover:bg-primary-hover shadow-md";
        if (variant === 'alert') variantStyles = "bg-alert text-white hover:bg-alert-hover shadow-md";
        if (variant === 'ghost') variantStyles = "hover:bg-panel-border/50 text-foreground";

        let sizeStyles = "";
        if (size === 'default') sizeStyles = "h-12 px-6 py-2 rounded-xl"; // Thumb friendly by default
        if (size === 'sm') sizeStyles = "h-9 px-3 rounded-lg text-xs";
        if (size === 'lg') sizeStyles = "h-14 px-8 rounded-2xl text-base";
        if (size === 'icon') sizeStyles = "h-12 w-12 rounded-xl"; // Square thumb target

        return (
            <button
                className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
