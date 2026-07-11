import React, { useState, useEffect } from 'react';
import { LocaleProvider } from './context/LocaleContext';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import DashboardPage from './pages/DashboardPage';
import FriendIntroPage from './pages/FriendIntroPage';
import FriendQuizPage from './pages/FriendQuizPage';
import FriendResultPage from './pages/FriendResultPage';
import IdentitiesPage from './pages/IdentitiesPage';
import FaqPage from './pages/FaqPage';
import PlansPage from './pages/PlansPage';

const parseHashRoute = (hash) => {
  const cleanHash = hash.replace(/^#/, ''); // e.g. "/friend/abc/quiz"
  
  if (cleanHash.startsWith('/result')) {
    return { type: 'result', slug: null };
  }

  if (cleanHash.startsWith('/dashboard')) {
    return { type: 'dashboard', slug: null };
  }

  if (cleanHash.startsWith('/identities')) {
    return { type: 'identities', slug: null };
  }
  
  if (cleanHash.startsWith('/faq')) {
    return { type: 'faq', slug: null };
  }

  if (cleanHash.startsWith('/plans')) {
    return { type: 'plans', slug: null };
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
  
  return { type: 'quiz', slug: null };
};

export default function App() {
  const [route, setRoute] = useState(() => {
    const initialRoute = parseHashRoute(window.location.hash);
    if (initialRoute.type === 'quiz' && localStorage.getItem('seenly_owner_token')) {
      return { type: 'dashboard', slug: null };
    }
    return initialRoute;
  });
  const [friendNickname, setFriendNickname] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHashRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Multi-tab session sync (logout if token is cleared in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // If the owner token is removed or cleared from localStorage in another tab
      if (e.key === 'seenly_owner_token' && !e.newValue) {
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
    if (route.type === 'quiz' && localStorage.getItem('seenly_owner_token')) {
      window.location.hash = '#/dashboard';
    } else if (
      (route.type === 'friend-intro' || route.type === 'friend-quiz' || route.type === 'friend-result') &&
      route.slug && route.slug === localStorage.getItem('seenly_owner_slug') &&
      localStorage.getItem('seenly_owner_token')
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
      const saved = sessionStorage.getItem('seenly_friend_state');
      let parsed = {};
      if (saved) {
        parsed = JSON.parse(saved);
      }
      sessionStorage.setItem('seenly_friend_state', JSON.stringify({
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
      case 'identities':
        return <IdentitiesPage />;
      case 'faq':
        return <FaqPage />;
      case 'plans':
        return <PlansPage />;
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
        return <QuizPage onComplete={handleCompleteSelfQuiz} />;
    }
  };

  return (
    <LocaleProvider>
      {renderRoute()}
    </LocaleProvider>
  );
}
