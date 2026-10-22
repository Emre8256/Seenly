import './utils/storageMigration';
import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { LocaleProvider } from './context/LocaleContext';
import LandingPage from './components/LandingPage';

// The public landing shell is synchronous; the registration flow remains a
// separate route chunk and is requested only when the visitor starts it.
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FriendIntroPage = lazy(() => import('./pages/FriendIntroPage'));
const FriendQuizPage = lazy(() => import('./pages/FriendQuizPage'));
const FriendResultPage = lazy(() => import('./pages/FriendResultPage'));
const IdentitiesPage = lazy(() => import('./pages/IdentitiesPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const parseHashRoute = (hash) => {
  const cleanHash = hash.replace(/^#/, ''); // e.g. "/friend/abc/quiz"
  
  if (/^\/result(?:\?|$)/.test(cleanHash)) {
    return { type: 'result', slug: null };
  }

  if (/^\/dashboard(?:\?|$)/.test(cleanHash)) {
    return { type: 'dashboard', slug: null };
  }

  if (/^\/settings(?:\?|$)/.test(cleanHash)) {
    return { type: 'settings', slug: null };
  }

  if (/^\/identities(?:\?|$)/.test(cleanHash)) {
    return { type: 'identities', slug: null };
  }
  
  if (/^\/faq(?:\?|$)/.test(cleanHash)) {
    return { type: 'faq', slug: null };
  }

  if (/^\/plans(?:\?|$)/.test(cleanHash)) {
    return { type: 'plans', slug: null };
  }

  if (/^\/terms(?:\?|$)/.test(cleanHash)) {
    return { type: 'terms', slug: null };
  }

  if (/^\/refund(?:\?|$)/.test(cleanHash)) {
    return { type: 'refund', slug: null };
  }

  if (/^\/privacy(?:\?|$)/.test(cleanHash)) {
    return { type: 'privacy', slug: null };
  }
  
  const friendQuizRegex = /^\/friend\/([^\/]+)\/quiz$/;
  const matchQuiz = cleanHash.match(friendQuizRegex);
  if (matchQuiz) {
    return { type: 'friend-quiz', slug: matchQuiz[1] };
  }
  
  const friendResultRegex = /^\/friend\/([^\/]+)\/result$/;
  const matchResult = cleanHash.match(friendResultRegex);
  if (matchResult) {
    return { type: 'friend-result', slug: matchResult[1] };
  }
  
  const friendIntroRegex = /^\/friend\/([^\/]+)$/;
  const matchIntro = cleanHash.match(friendIntroRegex);
  if (matchIntro) {
    return { type: 'friend-intro', slug: matchIntro[1] };
  }
  
  if (cleanHash === '' || cleanHash === '/' || cleanHash === 'nasil-calisir' || cleanHash === '/nasil-calisir' || cleanHash === 'quiz' || cleanHash === '/quiz' || /^\/quiz(?:\?|$)/.test(cleanHash)) return { type: 'quiz', slug: null };
  return { type: 'not-found', slug: null };
};

export default function App() {
  const [route, setRoute] = useState(() => {
    const initialRoute = parseHashRoute(window.location.hash);
    if (initialRoute.type === 'quiz' && (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'))) {
      return { type: 'dashboard', slug: null };
    }
    return initialRoute;
  });
  const [friendNickname, setFriendNickname] = useState('');
  const [showLandingHeader, setShowLandingHeader] = useState(() => {
    const cleanHash = window.location.hash.replace(/^#/, '');
    if ((cleanHash === 'quiz' || cleanHash === '/quiz' || /^\/quiz(?:\?|$)/.test(cleanHash))) {
      return false;
    }
    return Number((sessionStorage.getItem('tensignal_currentIndex') || sessionStorage.getItem('seenly_currentIndex')) || -1) === -1;
  });

  const handleLandingStart = useCallback(() => {
    sessionStorage.setItem('tensignal_isQuickLogin', 'false');
    sessionStorage.setItem('seenly_isQuickLogin', 'false');
    sessionStorage.setItem('tensignal_currentIndex', '-2');
    sessionStorage.setItem('seenly_currentIndex', '-2');
    setShowLandingHeader(false);
  }, []);

  const handleLandingLogin = useCallback(() => {
    sessionStorage.setItem('tensignal_isQuickLogin', 'true');
    sessionStorage.setItem('seenly_isQuickLogin', 'true');
    sessionStorage.setItem('tensignal_currentIndex', '-5');
    sessionStorage.setItem('seenly_currentIndex', '-5');
    setShowLandingHeader(false);
  }, []);

  const handleLandingVisibilityChange = useCallback((visible) => {
    setShowLandingHeader(visible);
  }, []);

  useEffect(() => {
    const handleTriggerStart = () => {
      setShowLandingHeader(false);
    };
    const handleTriggerLogin = () => {
      setShowLandingHeader(false);
    };
    const handleTriggerLanding = () => {
      setShowLandingHeader(true);
    };
    window.addEventListener('tensignal_trigger_start_quiz', handleTriggerStart);
    window.addEventListener('tensignal_trigger_login', handleTriggerLogin);
    window.addEventListener('tensignal_trigger_landing', handleTriggerLanding);
    return () => {
      window.removeEventListener('tensignal_trigger_start_quiz', handleTriggerStart);
      window.removeEventListener('tensignal_trigger_login', handleTriggerLogin);
      window.removeEventListener('tensignal_trigger_landing', handleTriggerLanding);
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = parseHashRoute(window.location.hash);
      setRoute(newRoute);
      if (newRoute.type === 'quiz') {
        const cleanHash = window.location.hash.replace(/^#/, '');
        const isQuizRoute = cleanHash === 'quiz' || cleanHash === '/quiz' || /^\/quiz(?:\?|$)/.test(cleanHash);
        const curIdx = Number((sessionStorage.getItem('tensignal_currentIndex') || sessionStorage.getItem('seenly_currentIndex')) || -1);
        if (isQuizRoute || curIdx !== -1) {
          setShowLandingHeader(false);
        } else {
          setShowLandingHeader(true);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Multi-tab session sync (logout if token is cleared in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // If the owner token is removed or cleared from localStorage in another tab
      if ((e.key === 'tensignal_owner_token' || e.key === 'seenly_owner_token') && !e.newValue) {
        // Redirect to home page
        window.location.hash = '#/';
        // Clear session storage for a clean state
        sessionStorage.clear();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Redirect if they land on quiz page but have an existing owner token
  // Also redirect if they try to access their own friend link
  useEffect(() => {
    if (route.type === 'quiz' && (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'))) {
      window.location.hash = '#/dashboard';
    } else if (
      (route.type === 'friend-intro' || route.type === 'friend-quiz' || route.type === 'friend-result') &&
      route.slug && route.slug === (localStorage.getItem('tensignal_owner_slug') || localStorage.getItem('seenly_owner_slug')) &&
      (localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token'))
    ) {
      window.location.hash = '#/dashboard';
    }
  }, [route]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const handleCompleteSelfQuiz = (token) => {
    window.location.hash = '#/dashboard';
  };

  const handleNavigateToSelfQuiz = () => {
    window.location.hash = '#/';
  };

  const handleStartFriendQuiz = (slug, nickname) => {
    setFriendNickname(nickname);
    try {
      const saved = sessionStorage.getItem('tensignal_friend_state') || sessionStorage.getItem('seenly_friend_state');
      let parsed = {};
      if (saved) {
        parsed = JSON.parse(saved);
      }
      sessionStorage.setItem('tensignal_friend_state', JSON.stringify({
        ...parsed,
        nickname: nickname,
        currentIndex: parsed.currentIndex || 0,
        answers: parsed.answers || {}
      }));
    } catch (e) {
      // Ignore
    }
    window.location.hash = `#/friend/${slug}/quiz`;
  };

  const handleCompleteFriendQuiz = (slug) => {
    window.location.hash = `#/friend/${slug}/result`;
  };

  const renderRoute = () => {
    switch (route.type) {
      case 'result':
        return <ResultPage onNavigateToQuiz={handleNavigateToSelfQuiz} />;
      case 'dashboard':
        return <DashboardPage onNavigateToQuiz={handleNavigateToSelfQuiz} />;
      case 'settings':
        return <SettingsPage />;
      case 'identities':
        return <IdentitiesPage />;
      case 'faq':
        return <FaqPage />;
      case 'plans':
        return <PlansPage />;
      case 'terms':
        return <TermsOfUsePage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'refund':
        return <RefundPolicyPage />;
      case 'not-found':
        return <NotFoundPage />;
      case 'friend-intro':
        return (
          <FriendIntroPage 
            slug={route.slug} 
            onStart={(nickname) => handleStartFriendQuiz(route.slug, nickname)} 
          />
        );
      case 'friend-quiz':
        return (
          <FriendQuizPage 
            slug={route.slug} 
            nickname={friendNickname} 
            onComplete={() => handleCompleteFriendQuiz(route.slug)} 
          />
        );
      case 'friend-result':
        return (
          <FriendResultPage 
            slug={route.slug} 
            onNavigateToQuiz={handleNavigateToSelfQuiz} 
          />
        );
      case 'quiz':
      default:
        if (showLandingHeader) {
          return <LandingPage onStartClick={handleLandingStart} onLoginClick={handleLandingLogin} />;
        }
        return (
          <QuizPage
            onComplete={handleCompleteSelfQuiz}
            onLandingVisibilityChange={handleLandingVisibilityChange}
          />
        );
    }
  };

  return (
    <LocaleProvider>
      <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
        {renderRoute()}
      </Suspense>
    </LocaleProvider>
  );
}
