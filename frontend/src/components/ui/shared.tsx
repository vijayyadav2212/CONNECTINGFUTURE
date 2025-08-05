import React from 'react';
import { LucideIcon } from 'lucide-react';

// Enhanced Card Component
interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({ 
  children, 
  className = "", 
  hover = true 
}) => {
  return (
    <div className={`
      bg-white rounded-2xl shadow-lg border border-slate-100 
      ${hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Enhanced Button Component
interface EnhancedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = "",
  disabled = false,
  icon: Icon,
  iconPosition = 'left'
}) => {
  const baseClasses = "font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105",
    secondary: "bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 border border-slate-300",
    outline: "bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-center space-x-2">
        {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
        <span>{children}</span>
        {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
      </div>
    </button>
  );
};

// Enhanced Input Component
interface EnhancedInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  icon?: LucideIcon;
  className?: string;
  error?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  icon: Icon,
  className = "",
  error
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 border border-slate-300 rounded-xl 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-200 bg-white
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Enhanced Select Component
interface EnhancedSelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
  error?: string;
  children: React.ReactNode;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  value,
  onChange,
  required = false,
  className = "",
  error,
  children
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full px-4 py-3 border border-slate-300 rounded-xl 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          transition-all duration-200 bg-white
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Enhanced Textarea Component
interface EnhancedTextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  required?: boolean;
  className?: string;
  error?: string;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  className = "",
  error
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`
          w-full px-4 py-3 border border-slate-300 rounded-xl 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          transition-all duration-200 bg-white resize-none
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Enhanced Checkbox Component
interface EnhancedCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: LucideIcon;
}

export const EnhancedCheckbox: React.FC<EnhancedCheckboxProps> = ({
  label,
  checked,
  onChange,
  className = "",
  icon: Icon
}) => {
  return (
    <label className={`
      flex items-center space-x-3 p-4 bg-blue-50 rounded-xl 
      border border-blue-200 hover:bg-blue-100 transition-colors 
      duration-200 cursor-pointer
      ${className}
    `}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 text-blue-600 bg-white border-blue-300 
                 rounded focus:ring-blue-500 focus:ring-2"
      />
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <span className="text-slate-700 font-medium">{label}</span>
      </div>
    </label>
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ""
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {children}
    </span>
  );
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-3">
        {Icon && <Icon className="w-6 h-6 text-blue-600" />}
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-slate-600">{subtitle}</p>
      )}
    </div>
  );
}; 