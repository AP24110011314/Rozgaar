/** Name kept for compatibility; dark mode is completely removed. Always light mode. */
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        isDark: false,
        setTheme: () => {},
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
