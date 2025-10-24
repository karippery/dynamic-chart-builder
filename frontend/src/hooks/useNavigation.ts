import { useState, useCallback } from 'react';
import { NavigationItem } from '../types/navigation';

export const useNavigation = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [toggleState, setToggleState] = useState(false);
  const [activePage, setActivePage] = useState<NavigationItem>({
    label: 'Main',
    path: '/main'
  });

  const handleRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
    console.log('Refreshing data...');
  }, []);

  const handleToggleChange = useCallback((value: boolean) => {
    setToggleState(value);
    console.log('Toggle state changed to:', value);
  }, []);

  const handleNavigationChange = useCallback((item: NavigationItem) => {
    setActivePage(item);
    console.log('Navigation changed to:', item.label);
  }, []);

  const getPageContent = useCallback(() => {
    switch (activePage.path) {
      case '/main':
        return {
          title: 'Welcome to KPI Dashboard',
          description: 'Your main content goes here...'
        };
      case '/close-call':
        return {
          title: 'Close-call Analysis',
          description: 'Monitor and analyze close-call incidents. Track near-miss events and identify potential safety issues before they occur.'
        };
      case '/safety':
        return {
          title: 'Safety Metrics',
          description: 'Comprehensive safety performance indicators. View safety compliance, incident reports, and preventive measures.'
        };
      default:
        return {
          title: 'Welcome to KPI Dashboard',
          description: 'Your main content goes here...'
        };
    }
  }, [activePage]);

  return {
    refreshCount,
    toggleState,
    activePage,
    handleRefresh,
    handleToggleChange,
    handleNavigationChange,
    getPageContent,
  };
};