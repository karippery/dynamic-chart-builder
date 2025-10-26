import { ReactElement } from "react";

export interface NavigationItem {
  icon?: ReactElement;
  label: string;
  path: string;
  active?: boolean;
}

export interface NavBarProps {
  onRefresh: () => void;
  onToggleChange: (value: boolean) => void;
  onNavigationChange: (item: NavigationItem) => void;
  toggleValue?: boolean;
  toggleLabel?: string;
  activePath?: string;
}