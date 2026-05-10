import { useState, useEffect, useCallback } from 'react';
import { PetType, PetLevel, WrongQuestion, WrongQuestionInput, UserData } from '@/types';

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
  const consumeItem = useCallback((itemId: string): boolean => {
    const currentCount = userData.userItems[itemId];
    if (!currentCount || currentCount <= 0) return false;

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
        petExp: prev.petExp + 2, // 使用物品获得额外成长值
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
    return true;
  }, [userData.userItems]);

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
    PET_FACES,
  };
}
