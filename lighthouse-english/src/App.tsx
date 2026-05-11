import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { resumeAudioContext } from '@/lib/gameSfx';
import { unlockSpeechFromUserGesture } from '@/lib/speechUnlock';
import { HomePage } from '@/pages/HomePage';
import { WordLearningPage } from '@/pages/WordLearningPage';
import { SentencePage } from '@/pages/SentencePage';
import { ReviewPage } from '@/pages/ReviewPage';
import { DialoguePage } from '@/pages/DialoguePage';
import { GamesPage } from '@/pages/GamesPage';
import { ListeningPage } from '@/pages/ListeningPage';
import { MatchingPage } from '@/pages/MatchingPage';
import { OrderingPage } from '@/pages/OrderingPage';
import { PetPage } from '@/pages/PetPage';
import { ShopPage } from '@/pages/ShopPage';
import { KidsPronunciationPractice } from '@/pages/KidsPronunciationPractice';
import { MarkedWordsPage } from '@/pages/MarkedWordsPage';

/** 首次触摸/按键后解锁 AudioContext，并让 speechSynthesis 脱离挂起态（部分浏览器默认 suspended）。麦克风仅在用户点击录音时请求，避免每次点击页面都触发权限流程。 */
function GlobalAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      unlockSpeechFromUserGesture();
      resumeAudioContext();
      try {
        const s = window.speechSynthesis;
        if (s) {
          s.getVoices();
          s.resume?.();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  return null;
}

function App() {
  return (
    <HashRouter>
      <GlobalAudioUnlock />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/word-learning" element={<WordLearningPage />} />
        <Route path="/sentence" element={<SentencePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/dialogue" element={<DialoguePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/listening" element={<ListeningPage />} />
        <Route path="/games/matching" element={<MatchingPage />} />
        <Route path="/games/ordering" element={<OrderingPage />} />
        <Route path="/pet" element={<PetPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/kids-pronunciation" element={<KidsPronunciationPractice />} />
        <Route path="/marked-words" element={<MarkedWordsPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
