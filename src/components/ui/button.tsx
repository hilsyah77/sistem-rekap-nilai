import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer"
    
    const variants = {
      default: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-700/20 active:scale-[0.98] transition-all",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-700/20 active:scale-[0.98] transition-all",
      warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-600/20 active:scale-[0.98] transition-all",
      outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 shadow-sm",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.98]",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
      link: "text-emerald-700 underline-offset-4 hover:underline",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-700/20",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-6 text-base font-semibold",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
