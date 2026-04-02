import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Dark mode
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // User info
      userName: '',
      setUserName: (name) => set({ userName: name }),

      // GitHub
      githubPat: '',
      githubUsername: '',
      githubPatConfigured: false,
      setGithubPat: (pat) => set({ githubPat: pat, githubPatConfigured: !!pat }),
      setGithubUsername: (username) => set({ githubUsername: username }),

      // Onboarding
      onboardingComplete: false,
      setOnboardingComplete: (val) => set({ onboardingComplete: val }),

      // City search
      lastCity: '',
      searchedCity: '', // tracks which city the current businesses belong to
      setLastCity: (city) => set({ lastCity: city }),
      setSearchedCity: (city) => set({ searchedCity: city }),

      // Businesses
      businesses: [],
      setBusinesses: (businesses) => set({ businesses }),
      updateBusiness: (placeId, updates) =>
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.place_id === placeId ? { ...b, ...updates } : b
          ),
        })),

      // Current business being worked on
      currentBusinessId: null,
      setCurrentBusinessId: (id) => set({ currentBusinessId: id }),
      getCurrentBusiness: () => {
        const state = get();
        return state.businesses.find((b) => b.place_id === state.currentBusinessId) || null;
      },

      // Theme wizard data (transient for current business)
      wizardData: {
        step: 1,
        context: {},
        moodWords: [],
        customMood: '',
        colors: { primary: '#4A6CF7', secondary: '#7C5CFC', neutral: '#E8E5E9', light: '#FAFAF8', dark: '#1A1A2E' },
        headingFont: 'Playfair Display',
        bodyFont: 'DM Sans',
        buttonRadius: 12,
        buttonColor: 'primary',
        backgroundMode: 'light',
        backgroundTone: 'tinted',
        includeGallery: null,
      },
      setWizardStep: (step) => set((state) => ({ wizardData: { ...state.wizardData, step } })),
      setWizardData: (data) => set((state) => ({ wizardData: { ...state.wizardData, ...data } })),
      resetWizard: () =>
        set({
          wizardData: {
            step: 1,
            context: {},
            moodWords: [],
            customMood: '',
            colors: { primary: '#4A6CF7', secondary: '#7C5CFC', neutral: '#E8E5E9', light: '#FAFAF8', dark: '#1A1A2E' },
            headingFont: 'Playfair Display',
            bodyFont: 'DM Sans',
            buttonRadius: 12,
            buttonColor: 'primary',
            backgroundMode: 'light',
            backgroundTone: 'tinted',
            includeGallery: null,
          },
        }),

      // Generated website HTML
      generatedHtml: '',
      setGeneratedHtml: (html) => set({ generatedHtml: html }),

      // Published URL
      publishedUrl: '',
      setPublishedUrl: (url) => set({ publishedUrl: url }),
      publishedRepoName: '',
      setPublishedRepoName: (name) => set({ publishedRepoName: name }),

      // Loading states
      isSearching: false,
      setIsSearching: (val) => set({ isSearching: val }),
      isGenerating: false,
      setIsGenerating: (val) => set({ isGenerating: val }),
      isPublishing: false,
      setIsPublishing: (val) => set({ isPublishing: val }),
    }),
    {
      name: 'webprospector_state',
      partialize: (state) => {
        const { githubPat, ...rest } = state;
        return rest;
      },
    }
  )
);

export default useStore;
