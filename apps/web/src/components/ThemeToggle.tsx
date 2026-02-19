import { Moon, Sun, Monitor } from 'lucide-react'
import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = theme === 'dark' || (theme === 'system' && systemDark)

    if (shouldBeDark) {
      root.classList.add('dark')
      setIsDark(true)
    } else {
      root.classList.remove('dark')
      setIsDark(false)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, setTheme, isDark }
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme, isDark } = useDarkMode()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'light' 
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Light mode"
      >
        <Sun className="h-5 w-5" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Dark mode"
      >
        <Moon className="h-5 w-5" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'system' 
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="System preference"
      >
        <Monitor className="h-5 w-5" />
      </button>
    </div>
  )
}
