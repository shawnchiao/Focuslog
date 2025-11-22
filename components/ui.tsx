import React, { ButtonHTMLAttributes, InputHTMLAttributes, forwardRef } from 'react';

// Utility to join classes
const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 duration-200";
  
  const variants = {
    default: "bg-gray-900 text-white hover:bg-black shadow-sm",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "hover:bg-gray-100 text-gray-500 hover:text-gray-900",
    destructive: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700"
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
        "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
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
        "appearance-none h-5 w-5 rounded-full border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-gray-100 focus:ring-offset-1",
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
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent", // Active selection style
    secondary: "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900", // Inactive style
    outline: "text-gray-600 border-gray-200"
  };
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-200",
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
  <div className={cn("rounded-xl border border-gray-100 bg-white shadow-sm", className)}>
    {children}
  </div>
);