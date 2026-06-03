/** @type {import('tailwindcss').Config} */
export default {
  // 기존 plain-CSS 디자인을 보존하기 위해 preflight(전역 리셋) 비활성화
  corePlugins: { preflight: false },
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0e4a84',
          dark: '#093461',
          light: '#e7eff7',
        },
        accent: '#c8102e',
        ink: '#0a2540',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 1px 2px rgba(10,37,64,0.04), 0 12px 40px rgba(10,37,64,0.08)',
      },
    },
  },
  plugins: [],
}
