/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#1e3a8a', // Blue-900 (User specified Primary Blue)
                    50: '#eff6ff', // blue-50
                    100: '#dbeafe', // blue-100
                    200: '#bfdbfe', // blue-200
                    300: '#93c5fd', // blue-300
                    400: '#60a5fa', // blue-400
                    500: '#3b82f6', // blue-500
                    600: '#2563eb', // blue-600
                    700: '#1d4ed8', // blue-700
                    800: '#1e40af', // blue-800
                    900: '#1e3a8a', // blue-900
                    950: '#172554', // blue-950
                },
                secondary: {
                    DEFAULT: '#8b5cf6', // Violet-500
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', // Blue-900 to Blue-800
                'gradient-header': 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)', // Blue-900 to Blue-600
                'gradient-dark': 'linear-gradient(to bottom right, #0f172a, #1e3a8a)',
                'gradient-card': 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(30, 58, 138, 0.1)', // Blue-900 based shadow
                'glass-sm': '0 4px 16px 0 rgba(30, 58, 138, 0.05)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.5)', // Blue-600 glow
                'glow-sm': '0 0 10px rgba(37, 99, 235, 0.3)',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px) translateZ(0)' },
                    '100%': { opacity: '1', transform: 'translateY(0) translateZ(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0) translateZ(0)' },
                    '50%': { transform: 'translateY(-10px) translateZ(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'marquee': 'marquee 25s linear infinite',
            },
        },
    },
    plugins: [],
}
