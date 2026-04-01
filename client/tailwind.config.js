/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    400: '#D4AF37',
                    500: '#C5A028',
                    600: '#B08D20',
                },
                dark: {
                    900: '#1a1a1a',
                    800: '#2d2d2d',
                }
            }
        },
    },
    plugins: [],
}
