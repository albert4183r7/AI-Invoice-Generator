import { Loader2 } from "lucide-react"

const Button = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  children,
  icon: Icon,
  ...props }) => {

    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";
    
    const variantClasses = {
      primary: "bg-blue-900 text-white hover:bg-gray-800",
      secondary: "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200",
      outline: "bg-transparent hover:bg-slate-100 text-slate-700",
    };

    const sizeClasses = {
      small: "px-3 py-1 h-8 text-sm",
      medium: "px-4 py-2 text-sm",
      large: "px-6 py-3 h-12 text-base",
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <>
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
          </>
        )}
        </button>
  )
}

export default Button