/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['index.html', 'src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
        extend: {
            spacing: {
                3.75: '15px',
            },
            colors: {
                primary: '#165DFF',
                danger: '#f56c6c',
                wx: '#3975C6',
                fff: '#fff',
            },
        },
    },
    plugins: [],
}
