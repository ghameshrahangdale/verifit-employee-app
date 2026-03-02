import React, { createContext, useContext, ReactNode } from 'react';
import { theme } from '../config/theme';
import { ThemeColors } from '../types';

interface ThemeContextType {
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({ colors: theme });

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ colors: theme }}>
      {children}
    </ThemeContext.Provider>
  );
};