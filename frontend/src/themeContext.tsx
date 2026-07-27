import React, { createContext, useContext, useState, useCallback } from "react";
import { useColorScheme, StyleSheet } from "react-native";
import { lightTheme, darkTheme, Theme } from "./theme";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<boolean | null>(null);

  const isDark = override !== null ? override : systemScheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  const toggleDark = useCallback(() => {
    setOverride((prev) => {
      if (prev === null) return systemScheme !== "dark";
      return !prev;
    });
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  makeStyles: (theme: Theme) => T
): T {
  const { theme } = useAppTheme();
  return StyleSheet.create(makeStyles(theme));
}