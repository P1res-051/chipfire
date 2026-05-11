/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        neon: {
          green: 'hsl(var(--neon-green))',
          blue: 'hsl(var(--neon-blue))',
          purple: 'hsl(var(--neon-purple))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        glow: '0 0 0 1px hsl(var(--border)), 0 0 20px rgba(255, 109, 0, 0.15)',
        'glow-orange': '0 0 0 1px rgba(255, 109, 0, 0.3), 0 0 20px rgba(255, 109, 0, 0.15)',
        'glow-purple': '0 0 0 1px rgba(199, 125, 255, 0.3), 0 0 20px rgba(199, 125, 255, 0.12)',
        'glow-green': '0 0 0 1px rgba(34, 197, 94, 0.35), 0 0 20px rgba(34, 197, 94, 0.18)'
      }
    }
  },
  plugins: []
}
