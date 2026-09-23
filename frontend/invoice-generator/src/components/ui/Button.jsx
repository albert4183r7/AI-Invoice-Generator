import { Loader2 } from "lucide-react"

const Button = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  children,
  icon: Icon,
  className = '',
  ...props }) => {

    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";

    const variantClasses = {
      primary: "bg-blue-900 text-white hover:bg-gray-800",
      secondary: "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200",
      outline: "bg-transparent hover:bg-slate-100 text-slate-700",
      // Used by the icon-only row actions (edit, delete, reminder) and the
      // dashboard's "View All". Without this key the variant resolved to
      // `undefined` and that literal string landed in the className.
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    };

    const sizeClasses = {
      small: "px-3 py-1 h-8 text-sm",
      medium: "px-4 py-2 text-sm",
      large: "px-6 py-3 h-12 text-base",
    };

    return (
      <button
        // `className` is destructured out of props deliberately: spreading
        // props after this attribute would let a caller's className replace the
        // whole computed string, which silently dropped the variant, size and
        // disabled: styling rather than adding to it.
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
