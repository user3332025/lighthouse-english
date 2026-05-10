import { useState, useEffect, useCallback } from 'react';
import { PetType, PetLevel, WrongQuestion, WrongQuestionInput, UserData, FoodPreference, WordLearningRecord, MarkedWord, REVIEW_INTERVALS } from '@/types';

const STORAGE_KEY = 'lighthouse_english_data';

// 小动物等级配置
export const PET_LEVELS: PetLevel[] = [
  { level: 1, name: '幼崽', minExp: 0, appearance: '🐣' },
  { level: 2, name: '成长', minExp: 10, appearance: '🌱' },
  { level: 3, name: '成年', minExp: 20, appearance: '⭐' },
  { level: 4, name: '伙伴', minExp: 30, appearance: '💫' },
  { level: 5, name: '守护者', minExp: 40, appearance: '👑' },
];

// 小动物表情
export const PET_FACES: Record<PetType, { normal: string; happy: string; sad: string; eating: string }> = {
  dog: { normal: '🐶', happy: '🐕', sad: '🐕‍🦺', eating: '🦴' },
  cat: { normal: '🐱', happy: '😺', sad: '😿', eating: '🐟' },
  rabbit: { normal: '🐰', happy: '🐇', sad: '🙁', eating: '🥕' },
  bear: { normal: '🐻', happy: '🐼', sad: '🐨', eating: '🍯' },
  fox: { normal: '🦊', happy: '🐕‍🦺', sad: '😔', eating: '🍎' },
};

/** 每个等级对应的主展示形态（与 Lv1–Lv5 对应，升级时变化更明显） */
export const PET_GROWTH_STAGES: Record<PetType, readonly [string, string, string, string, string]> = {
  dog: ['🐶', '🐕', '🦮', '🐩', '👑'],
  cat: ['🐱', '😺', '😸', '😼', '😻'],
  rabbit: ['🐰', '🐇', '🥕', '💫', '👑'],
  bear: ['🐻', '🧸', '🐻', '🐼', '👑'],
  fox: ['🦊', '🦊', '🐺', '✨', '👑'],
};

export const PET_FOOD_PREFERENCES: Record<PetType, Record<string, FoodPreference>> = {
  dog: {
    bone: 'favorite',
    meat: 'favorite',
    poultry: 'favorite',
    fish: 'good',
    egg: 'good',
    carrot: 'neutral',
    apple: 'neutral',
    milk: 'neutral',
    bread: 'neutral',
    chocolate: 'bad',
    grape: 'bad',
    onion: 'bad',
    garlic: 'bad',
    coffee: 'bad',
    beer: 'bad',
    wine: 'bad',
  },
  cat: {
    fish: 'favorite',
    'fish-cake': 'favorite',
    shrimp: 'favorite',
    meat: 'good',
    egg: 'good',
    milk: 'neutral',
    bread: 'neutral',
    chocolate: 'bad',
    grape: 'bad',
    onion: 'bad',
    garlic: 'bad',
    coffee: 'bad',
    beer: 'bad',
    wine: 'bad',
  },
  rabbit: {
    carrot: 'favorite',
    lettuce: 'favorite',
    grass: 'favorite',
    apple: 'good',
    banana: 'good',
    corn: 'good',
    bread: 'neutral',
    milk: 'neutral',
    meat: 'bad',
    fish: 'bad',
    chocolate: 'bad',
    onion: 'bad',
    garlic: 'bad',
    coffee: 'bad',
    beer: 'bad',
    wine: 'bad',
  },
  bear: {
    honey: 'favorite',
    fish: 'favorite',
    meat: 'favorite',
    berry: 'good',
    apple: 'good',
    bread: 'neutral',
    corn: 'neutral',
    chocolate: 'bad',
    grape: 'bad',
    onion: 'bad',
    garlic: 'bad',
    coffee: 'bad',
    beer: 'bad',
    wine: 'bad',
  },
  fox: {
    chicken: 'favorite',
    rabbit: 'favorite',
    berry: 'favorite',
    apple: 'good',
    fish: 'good',
    meat: 'good',
    bread: 'neutral',
    corn: 'neutral',
    chocolate: 'bad',
    grape: 'bad',
    onion: 'bad',
    garlic: 'bad',
    coffee: 'bad',
    beer: 'bad',
    wine: 'bad',
  },
};

export function getFoodPreference(petType: PetType, itemId: string): FoodPreference {
  return PET_FOOD_PREFERENCES[petType]?.[itemId] || 'neutral';
}

export function getGrowthValue(petType: PetType, itemId: string): number {
  const preference = getFoodPreference(petType, itemId);
  switch (preference) {
    case 'favorite':
      return 3;
    case 'good':
      return 2;
    case 'neutral':
      return 1;
    case 'bad':
      return 0;
    default:
      return 1;
  }
}

export function getPetStageEmoji(pet: PetType, level: number): string {
  const stages = PET_GROWTH_STAGES[pet];
  if (!stages) return '🐾';
  const idx = Math.max(0, Math.min(level - 1, stages.length - 1));
  return stages[idx];
}

// 默认用户数据
const defaultUserData: UserData = {
  points: 0,
  adoptedPet: null,
  petExp: 0,
  petLevel: 1,
  wrongQuestions: [],
  gameHistory: {},
  voiceEnabled: true,
  userItems: {},
  wordLearningRecords: [],
  markedWords: [],
};

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserData({ ...defaultUserData, ...parsed });
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 添加积分
  const addPoints = useCallback((points: number) => {
    setUserData(prev => {
      const newData = { ...prev, points: prev.points + points };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 消耗积分
  const spendPoints = useCallback((points: number): boolean => {
    if (userData.points < points) return false;
    setUserData(prev => {
      const newData = { ...prev, points: prev.points - points };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
    return true;
  }, [userData.points]);

  // 领养小动物
  const adoptPet = useCallback((petType: PetType) => {
    setUserData(prev => {
      const newData = {
        ...prev,
        adoptedPet: petType,
        petExp: 0,
        petLevel: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 喂养小动物
  const feedPet = useCallback((): { success: boolean; leveledUp: boolean; newLevel?: number } => {
    if (userData.points < 30 || !userData.adoptedPet) {
      return { success: false, leveledUp: false };
    }

    const newExp = userData.petExp + 1;
    const currentLevelIndex = PET_LEVELS.findIndex(l => l.level === userData.petLevel);
    const nextLevel = PET_LEVELS[currentLevelIndex + 1];
    const leveledUp = nextLevel && newExp >= nextLevel.minExp;

    setUserData(prev => {
      const newData = {
        ...prev,
        points: prev.points - 30,
        petExp: newExp,
        petLevel: leveledUp ? (nextLevel?.level || prev.petLevel) : prev.petLevel,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });

    return {
      success: true,
      leveledUp,
      newLevel: leveledUp ? nextLevel?.level : undefined
    };
  }, [userData.points, userData.adoptedPet, userData.petExp, userData.petLevel]);

  // 添加错题
  const addWrongQuestion = useCallback((wrong: WrongQuestionInput) => {
    setUserData(prev => {
      const existing = prev.wrongQuestions.findIndex(q => q.id === wrong.id);
      let newWrongQuestions: WrongQuestion[];

      if (existing >= 0) {
        newWrongQuestions = [...prev.wrongQuestions];
        newWrongQuestions[existing] = {
          ...newWrongQuestions[existing],
          wrongCount: newWrongQuestions[existing].wrongCount + 1,
          correctCount: 0,
          lastAttempt: Date.now(),
        };
      } else {
        newWrongQuestions = [...prev.wrongQuestions, { ...wrong, wrongCount: 1, correctCount: 0, lastAttempt: Date.now() }];
      }

      const newData = { ...prev, wrongQuestions: newWrongQuestions };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 答对错题本中的题目
  const markWrongQuestionCorrect = useCallback((questionId: string) => {
    setUserData(prev => {
      const newWrongQuestions = prev.wrongQuestions.map(q => {
        if (q.id === questionId) {
          return { ...q, correctCount: q.correctCount + 1 };
        }
        return q;
      }).filter(q => q.correctCount < 3); // 连续正确3次移出错题本

      const newData = { ...prev, wrongQuestions: newWrongQuestions };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 更新语音状态
  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setUserData(prev => {
      const newData = { ...prev, voiceEnabled: enabled };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 获取当前等级信息
  const getCurrentLevel = useCallback(() => {
    return PET_LEVELS.find(l => l.level === userData.petLevel) || PET_LEVELS[0];
  }, [userData.petLevel]);

  // 获取下一等级信息
  const getNextLevel = useCallback(() => {
    const currentIndex = PET_LEVELS.findIndex(l => l.level === userData.petLevel);
    return PET_LEVELS[currentIndex + 1] || null;
  }, [userData.petLevel]);

  // 获取当前等级进度
  const getLevelProgress = useCallback(() => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    
    if (!nextLevel) return 100;
    
    const levelStart = currentLevel.minExp;
    const levelEnd = nextLevel.minExp;
    const progress = ((userData.petExp - levelStart) / (levelEnd - levelStart)) * 100;
    
    return Math.min(100, Math.max(0, progress));
  }, [userData.petExp, getCurrentLevel, getNextLevel]);

  // 获取物品
  const getItem = useCallback((itemId: string) => {
    setUserData(prev => {
      const newData = {
        ...prev,
        userItems: {
          ...prev.userItems,
          [itemId]: (prev.userItems[itemId] || 0) + 1,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 使用物品（消耗一个）
  const consumeItem = useCallback((itemId: string): { success: boolean; growth: number; isBad: boolean } => {
    const currentCount = userData.userItems[itemId];
    if (!currentCount || currentCount <= 0) return { success: false, growth: 0, isBad: false };
    if (!userData.adoptedPet) return { success: false, growth: 0, isBad: false };

    const growth = getGrowthValue(userData.adoptedPet, itemId);
    const preference = getFoodPreference(userData.adoptedPet, itemId);

    setUserData(prev => {
      const newCount = prev.userItems[itemId] - 1;
      const newUserItems = { ...prev.userItems };
      
      if (newCount <= 0) {
        delete newUserItems[itemId];
      } else {
        newUserItems[itemId] = newCount;
      }

      const newData = {
        ...prev,
        userItems: newUserItems,
        petExp: prev.petExp + growth,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
    return { success: true, growth, isBad: preference === 'bad' };
  }, [userData.userItems, userData.adoptedPet]);

  // 标记单词已学习
  const markWordLearned = useCallback((word: string, textbookId: string, unitId: number) => {
    setUserData(prev => {
      const existingIndex = prev.wordLearningRecords.findIndex(
        r => r.word === word && r.textbookId === textbookId && r.unitId === unitId
      );

      let newRecords: WordLearningRecord[];
      if (existingIndex >= 0) {
        newRecords = [...prev.wordLearningRecords];
        newRecords[existingIndex] = {
          ...newRecords[existingIndex],
          learnedAt: Date.now(),
          nextReviewAt: Date.now(),
          reviewCount: 0,
          correctCount: 0,
          wrongCount: 0,
          currentIntervalIndex: 0,
          isMastered: false,
        };
      } else {
        newRecords = [
          ...prev.wordLearningRecords,
          {
            word,
            textbookId,
            unitId,
            learnedAt: Date.now(),
            nextReviewAt: Date.now(),
            reviewCount: 0,
            correctCount: 0,
            wrongCount: 0,
            currentIntervalIndex: 0,
            isMastered: false,
          },
        ];
      }

      const newData = { ...prev, wordLearningRecords: newRecords };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 记录单词复习结果
  const recordWordReview = useCallback((word: string, textbookId: string, unitId: number, isCorrect: boolean) => {
    setUserData(prev => {
      const newRecords = prev.wordLearningRecords.map(record => {
        if (record.word === word && record.textbookId === textbookId && record.unitId === unitId) {
          let newIntervalIndex = record.currentIntervalIndex;
          let newNextReviewAt = record.nextReviewAt;
          let newIsMastered = record.isMastered;

          if (isCorrect) {
            // 答对：延长复习间隔
            newIntervalIndex = Math.min(record.currentIntervalIndex + 1, REVIEW_INTERVALS.length - 1);
            newNextReviewAt = Date.now() + REVIEW_INTERVALS[newIntervalIndex] * 60 * 1000;
            // 连续答对2-3次视为掌握
            const newCorrectCount = record.correctCount + 1;
            if (newCorrectCount >= 2 && newIntervalIndex >= REVIEW_INTERVALS.length - 2) {
              newIsMastered = true;
            }
            return {
              ...record,
              reviewCount: record.reviewCount + 1,
              correctCount: newCorrectCount,
              currentIntervalIndex: newIntervalIndex,
              nextReviewAt: newNextReviewAt,
              isMastered: newIsMastered,
            };
          } else {
            // 答错：缩短间隔，加入高频复习
            newIntervalIndex = Math.max(record.currentIntervalIndex - 1, 0);
            newNextReviewAt = Date.now() + REVIEW_INTERVALS[newIntervalIndex] * 60 * 1000;
            return {
              ...record,
              reviewCount: record.reviewCount + 1,
              wrongCount: record.wrongCount + 1,
              correctCount: 0, // 重置连续答对计数
              currentIntervalIndex: newIntervalIndex,
              nextReviewAt: newNextReviewAt,
              isMastered: false,
            };
          }
        }
        return record;
      });

      const newData = { ...prev, wordLearningRecords: newRecords };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 获取待复习的单词列表
  const getWordsForReview = useCallback((): WordLearningRecord[] => {
    const now = Date.now();
    return userData.wordLearningRecords
      .filter(record => !record.isMastered && record.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  }, [userData.wordLearningRecords]);

  // 添加到生词本/重点词
  const addMarkedWord = useCallback((word: string, textbookId: string, unitId: number, meaning: string, phonetic: string) => {
    setUserData(prev => {
      const existingIndex = prev.markedWords.findIndex(
        w => w.word === word && w.textbookId === textbookId && w.unitId === unitId
      );

      let newMarkedWords: MarkedWord[];
      if (existingIndex >= 0) {
        newMarkedWords = [...prev.markedWords];
        newMarkedWords[existingIndex] = {
          ...newMarkedWords[existingIndex],
          markedAt: Date.now(),
          meaning,
          phonetic,
        };
      } else {
        newMarkedWords = [
          ...prev.markedWords,
          {
            word,
            textbookId,
            unitId,
            markedAt: Date.now(),
            meaning,
            phonetic,
          },
        ];
      }

      const newData = { ...prev, markedWords: newMarkedWords };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 从生词本移除
  const removeMarkedWord = useCallback((word: string, textbookId: string, unitId: number) => {
    setUserData(prev => {
      const newMarkedWords = prev.markedWords.filter(
        w => !(w.word === word && w.textbookId === textbookId && w.unitId === unitId)
      );
      const newData = { ...prev, markedWords: newMarkedWords };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // 检查是否已标记为重点词
  const isWordMarked = useCallback((word: string, textbookId: string, unitId: number): boolean => {
    return userData.markedWords.some(
      w => w.word === word && w.textbookId === textbookId && w.unitId === unitId
    );
  }, [userData.markedWords]);

  return {
    userData,
    isLoaded,
    addPoints,
    spendPoints,
    adoptPet,
    feedPet,
    addWrongQuestion,
    markWrongQuestionCorrect,
    setVoiceEnabled,
    getCurrentLevel,
    getNextLevel,
    getLevelProgress,
    getItem,
    consumeItem,
    getFoodPreference,
    getGrowthValue,
    PET_FACES,
  };
}
