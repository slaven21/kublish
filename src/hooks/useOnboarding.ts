import { useState, useEffect } from 'react';

interface OnboardingState {
  hasSeenGuide: boolean;
  completedSteps: string[];
  dismissedTooltips: string[];
}

const ONBOARDING_STORAGE_KEY = 'kublish_onboarding_state';

const getInitialState = (): OnboardingState => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load onboarding state:', error);
  }
  
  return {
    hasSeenGuide: false,
    completedSteps: [],
    dismissedTooltips: []
  };
};

const saveState = (state: OnboardingState) => {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save onboarding state:', error);
  }
};

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(getInitialState);

  const updateState = (updates: Partial<OnboardingState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    saveState(newState);
  };

  const markGuideComplete = () => {
    updateState({ hasSeenGuide: true });
  };

  const markStepComplete = (stepId: string) => {
    if (!state.completedSteps.includes(stepId)) {
      updateState({
        completedSteps: [...state.completedSteps, stepId]
      });
    }
  };

  const dismissTooltip = (tooltipId: string) => {
    if (!state.dismissedTooltips.includes(tooltipId)) {
      updateState({
        dismissedTooltips: [...state.dismissedTooltips, tooltipId]
      });
    }
  };

  const resetOnboarding = () => {
    const resetState: OnboardingState = {
      hasSeenGuide: false,
      completedSteps: [],
      dismissedTooltips: []
    };
    setState(resetState);
    saveState(resetState);
    
    // Also clear the tooltip dismissal state
    localStorage.removeItem('kublish_dismissed_tooltips');
  };

  const shouldShowGuide = () => {
    return !state.hasSeenGuide;
  };

  const shouldShowTooltip = (tooltipId: string) => {
    return !state.dismissedTooltips.includes(tooltipId);
  };

  const isStepCompleted = (stepId: string) => {
    return state.completedSteps.includes(stepId);
  };

  return {
    state,
    markGuideComplete,
    markStepComplete,
    dismissTooltip,
    resetOnboarding,
    shouldShowGuide,
    shouldShowTooltip,
    isStepCompleted
  };
};