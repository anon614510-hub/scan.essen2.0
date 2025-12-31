"use client";

import React, { useState, useEffect } from "react";
import ArInterface from "@/components/ArInterface";
import ErrorBoundary from "@/components/ErrorBoundary";
import Onboarding from "@/components/Onboarding";
import { UserProfile } from "@/lib/types";

const ONBOARDING_SESSION_KEY = "fridgeforager_session_onboarded";

export default function Home() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    const sessionOnboarded = sessionStorage.getItem(ONBOARDING_SESSION_KEY);
    if (sessionOnboarded === "true") {
      setIsOnboardingComplete(true);
    } else {
      setIsOnboardingComplete(false);
    }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    console.log("Onboarding completed with profile:", profile);
    setUserProfile(profile);
    setIsOnboardingComplete(true);

    // Save to sessionStorage (persists during session, clears on refresh/close)
    sessionStorage.setItem(ONBOARDING_SESSION_KEY, "true");

    // Replace history so back button doesn't go to onboarding
    window.history.replaceState({ page: 'camera' }, '', '/');
  };

  // Prevent back button from going to onboarding
  useEffect(() => {
    if (isOnboardingComplete) {
      const handlePopState = () => {
        // Always stay on camera page
        window.history.pushState({ page: 'camera' }, '', '/');
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOnboardingComplete]);

  // Show loading while checking sessionStorage
  if (isOnboardingComplete === null) {
    return (
      <main className="w-full h-[100dvh] bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="w-full h-[100dvh]">
        {!isOnboardingComplete ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
          <ArInterface />
        )}
      </main>
    </ErrorBoundary>
  );
}
