import { useTheme, Theme } from "./theme";
import { StyleSheet } from "react-native";

export function useAppTheme(): { theme: Theme } {
  const theme = useTheme();
  return { theme };
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  makeStyles: (theme: Theme) => T
): T {
  const theme = useTheme();
  return StyleSheet.create(makeStyles(theme));
}