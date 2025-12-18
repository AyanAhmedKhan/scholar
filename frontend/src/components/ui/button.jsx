import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0",
                destructive:
                    "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
                outline:
                    "border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-200 text-slate-700",
                secondary:
                    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm",
                ghost: "hover:bg-slate-100 hover:text-slate-900",
                link: "text-blue-600 underline-offset-4 hover:underline",
                glow: "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:bg-blue-700 border-0",
            },
            size: {
                default: "h-11 px-6 py-2.5 rounded-xl",
                sm: "h-9 rounded-lg px-4 text-xs uppercase tracking-wider font-bold",
                lg: "h-14 rounded-2xl px-10 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
        (<Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props} />)
    );
})
Button.displayName = "Button"

export { Button, buttonVariants }
