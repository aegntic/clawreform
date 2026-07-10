import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      data-active={isLight ? 'true' : 'false'}
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      type="button"
    >
      <span className="theme-toggle-thumb" aria-hidden="true" />
    </button>
  )
}
