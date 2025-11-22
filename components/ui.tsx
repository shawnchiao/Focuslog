import React, { ButtonHTMLAttributes, InputHTMLAttributes, forwardRef } from 'react';

// Utility to join classes
const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95";
  
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
    destructive: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700"
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-7 rounded px-2 text-xs",
    icon: "h-8 w-8"
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

// Input
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

// Checkbox - Circular Apple Style
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "appearance-none h-5 w-5 rounded-full border border-slate-300 checked:bg-slate-900 checked:border-slate-900 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-slate-100 focus:ring-offset-1",
        "after:content-[''] after:absolute after:top-[2px] after:left-[6px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100",
        className
      )}
      {...props}
    />
  );
});

// Badge - Notion Style Tag
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default', onClick }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent", // Active selection style
    secondary: "bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700", // Inactive style
    outline: "text-slate-600 border-slate-200"
  };
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        onClick ? "cursor-pointer select-none" : "",
        className
      )}
    >
      {children}
    </div>
  );
};

// Card - Clean container
interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => (
  <div className={cn("rounded-xl border border-slate-100 bg-white", className)}>
    {children}
  </div>
);