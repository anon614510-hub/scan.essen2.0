"use client";

import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types';
import Onboarding from '@/components/Onboarding';
import ArInterface from '@/components/ArInterface';
import { getOrCreateDbUser, saveDbUserProfile } from '@/lib/db-actions';

const globalForOnboarding = globalThis as unknown as {
  hasCompletedSession: boolean;
};

export default function Home() {
  const router = useRouter();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check DB status on mount
  useEffect(() => {
    // fast path: if already completed in this session (and DB might check later or fail)
    if (globalForOnboarding.hasCompletedSession) {
      setIsOnboardingComplete(true);
    }

    startTransition(async () => {
      try {
        const dbUser = await getOrCreateDbUser();
        if (dbUser && dbUser.profile) {
          // Profile exists -> Onboarding is explicitly COMPLETE
          setUserProfile(dbUser.profile as unknown as UserProfile);
          setIsOnboardingComplete(true);
          globalForOnboarding.hasCompletedSession = true;
        } else {
          // No profile -> Needs onboarding (unless session already done)
          if (!globalForOnboarding.hasCompletedSession) {
            setIsOnboardingComplete(false);
          }
        }
      } catch (error) {
        console.error("Failed to check user status:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  // Prevent back button from going to onboarding or weird states
  useEffect(() => {
    if (isOnboardingComplete && !isLoading) {
      // 1. Push a new state so we have something to pop
      window.history.pushState(null, '', window.location.href);

      const handlePopState = () => {
        // 2. When user clicks back, push state AGAIN to stay here
        window.history.pushState(null, '', window.location.href);
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOnboardingComplete, isLoading]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    startTransition(async () => {
      try {
        // Save to database
        await saveDbUserProfile(profile);
        setUserProfile(profile);
        setIsOnboardingComplete(true);
        globalForOnboarding.hasCompletedSession = true;
        router.refresh(); // This might cause a reload, but session var should persist if soft refresh
      } catch (error) {
        console.error("Error saving profile:", error);
        // Fallback: still show main app even if save failed transiently
        setUserProfile(profile);
        setIsOnboardingComplete(true);
        globalForOnboarding.hasCompletedSession = true;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7f0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b8e23]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f0]">
      {!isOnboardingComplete ? (
        <Onboarding onComplete={handleOnboardingComplete} initialProfile={userProfile} />
      ) : (
        <ArInterface userProfile={userProfile} />
      )}
    </main>
  );
}
