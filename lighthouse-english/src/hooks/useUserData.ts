import { useState, useEffect, useCallback } from 'react';
import { Pet, PetType, PetLevel, WrongQuestion, WrongQuestionInput, UserData, PetHome, WordLearningRecord, MarkedWord, REVIEW_INTERVALS } from '@/types';
import { findItemById, PET_EMOJIS } from '@/data/petItems';

const STORAGE_KEY = 'lighthouse_english_data_v2';

export const PET_LEVELS: PetLevel[] = [
  { level: 1, name: '幼崽', minExp: 0, appearance: '🐣' },
  { level: 2, name: '成长', minExp: 50, appearance: '🌱' },
  { level: 3, name: '成年', minExp: 150, appearance: '⭐' },
  { level: 4, name: '伙伴', minExp: 300, appearance: '💫' },
  { level: 5, name: '守护者', minExp: 500, appearance: '👑' },
];

export const PET_NAMES: Record<PetType, string> = {
  dog: '小狗狗',
  cat: '小猫咪',
  rabbit: '小兔子',
  bear: '小熊',
  fox: '小狐狸',
};

export const PET_FACES: Record<PetType, { normal: string; happy: string; hungry: string; sleeping: string }> = {
  dog: { normal: '🐶', happy: '🐕', hungry: '🥺', sleeping: '😴' },
  cat: { normal: '🐱', happy: '😺', hungry: '😿', sleeping: '😴' },
  rabbit: { normal: '🐰', happy: '🐇', hungry: '🥺', sleeping: '😴' },
  bear: { normal: '🐻', happy: '🐻‍❄️', hungry: '🥺', sleeping: '😴' },
  fox: { normal: '🦊', happy: '🦝', hungry: '🥺', sleeping: '😴' },
};

// 默认用户数据
const defaultUserData: UserData = {
  points: 0,
  wrongQuestions: [],
  gameHistory: {},
  voiceEnabled: true,
  inventory: {},
  wordLearningRecords: [],
  markedWords: [],
  petHome: {
    pets: [],
    activePetId: null,
  },
  completedQuizzes: { dialogue: 0, sentence: 0, listening: 0, matching: 0, ordering: 0 },
};

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 创建新宠物
function createPet(type: PetType, name?: string): Pet {
  return {
    id: generateId(),
    type,
    name: name || PET_NAMES[type],
    level: 1,
    exp: 0,
    hunger: 50,
    happiness: 50,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    adoptedAt: Date.now(),
  };
}

// 创建测试用宠物（可指定任意等级，测试阶段专用）
function createTestPet(type: PetType, level: number, name?: string): Pet {
  const levelConfig = PET_LEVELS[Math.min(level, PET_LEVELS.length) - 1] || PET_LEVELS[0];
  const expForLevel = (level: number) => {
    const lvl = PET_LEVELS[Math.min(level, PET_LEVELS.length) - 1];
    return lvl ? lvl.minExp + 10 : 10;
  };

  return {
    id: generateId(),
    type,
    name: name || PET_NAMES[type],
    level: levelConfig.level,
    exp: expForLevel(levelConfig.level),
    hunger: 80,
    happiness: 80,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    adoptedAt: Date.now(),
  };
}

// 计算宠物等级
function calculateLevel(exp: number): number {
  for (let i = PET_LEVELS.length - 1; i >= 0; i--) {
    if (exp >= PET_LEVELS[i].minExp) {
      return PET_LEVELS[i].level;
    }
  }
  return 1;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const saveData = useCallback((newData: UserData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  }, []);

  const addPoints = useCallback((points: number) => {
    setUserData(prev => saveData({ ...prev, points: prev.points + points }));
  }, [saveData]);

  const spendPoints = useCallback((points: number): boolean => {
    if (userData.points < points) return false;
    setUserData(prev => saveData({ ...prev, points: prev.points - points }));
    return true;
  }, [userData.points, saveData]);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setUserData(prev => saveData({ ...prev, voiceEnabled: enabled }));
  }, [saveData]);

  const getCurrentLevel = useCallback(() => {
    const exp = userData.wordLearningRecords.reduce((sum, r) => sum + r.correctCount * 10, 0);
    for (let i = PET_LEVELS.length - 1; i >= 0; i--) {
      if (exp >= PET_LEVELS[i].minExp) {
        return PET_LEVELS[i];
      }
    }
    return PET_LEVELS[0];
  }, [userData.wordLearningRecords]);

  const getLevelProgress = useCallback(() => {
    const current = getCurrentLevel();
    const idx = PET_LEVELS.findIndex(p => p.level === current.level);
    const next = PET_LEVELS[idx + 1];
    if (!next) return 100;
    const exp = userData.wordLearningRecords.reduce((sum, r) => sum + r.correctCount * 10, 0);
    const progress = (exp - current.minExp) / (next.minExp - current.minExp) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [getCurrentLevel, userData.wordLearningRecords]);

  const getWordsForReview = useCallback(() => {
    const now = Date.now();
    return userData.wordLearningRecords.filter(r => {
      if (r.correctCount >= 3) return false;
      const daysSinceReview = (now - r.lastReview) / (1000 * 60 * 60 * 24);
      return daysSinceReview >= r.intervalDays;
    });
  }, [userData.wordLearningRecords]);

  const addWrongQuestion = useCallback((question: WrongQuestion) => {
    setUserData(prev => {
      const existing = prev.wrongQuestions.find(
        q => q.questionId === question.questionId
      );
      if (existing) return prev;
      return saveData({
        ...prev,
        wrongQuestions: [...prev.wrongQuestions, question],
      });
    });
  }, [saveData]);

  const markWrongQuestionCorrect = useCallback((questionId: string) => {
    setUserData(prev => {
      return saveData({
        ...prev,
        wrongQuestions: prev.wrongQuestions.filter(
          q => q.questionId !== questionId
        ),
      });
    });
  }, [saveData]);

  const markWordLearned = useCallback((word: string) => {
    setUserData(prev => {
      const existing = prev.wordLearningRecords.find(r => r.word === word);
      if (existing) return prev;
      return saveData({
        ...prev,
        wordLearningRecords: [
          ...prev.wordLearningRecords,
          {
            word,
            learnedAt: Date.now(),
            correctCount: 0,
            lastReview: Date.now(),
            intervalDays: 1,
          },
        ],
      });
    });
  }, [saveData]);

  const recordWordReview = useCallback((word: string, correct: boolean) => {
    setUserData(prev => {
      const records = [...prev.wordLearningRecords];
      const idx = records.findIndex(r => r.word === word);
      if (idx === -1) {
        return saveData({
          ...prev,
          wordLearningRecords: [
            ...records,
            {
              word,
              learnedAt: Date.now(),
              correctCount: correct ? 1 : 0,
              lastReview: Date.now(),
              intervalDays: 1,
            },
          ],
        });
      }
      const record = records[idx];
      const newCount = correct ? record.correctCount + 1 : 0;
      const newInterval = correct
        ? Math.min(record.intervalDays * 2, 30)
        : 1;
      records[idx] = {
        ...record,
        correctCount: newCount,
        lastReview: Date.now(),
        intervalDays: newInterval,
      };
      return saveData({ ...prev, wordLearningRecords: records });
    });
  }, [saveData]);

  const addMarkedWord = useCallback((word: MarkedWord) => {
    setUserData(prev => {
      const existing = prev.markedWords.find(
        w => w.wordId === word.wordId
      );
      if (existing) return prev;
      return saveData({
        ...prev,
        markedWords: [...prev.markedWords, word],
      });
    });
  }, [saveData]);

  const removeMarkedWord = useCallback((wordId: string) => {
    setUserData(prev => {
      return saveData({
        ...prev,
        markedWords: prev.markedWords.filter(
          w => w.wordId !== wordId
        ),
      });
    });
  }, [saveData]);

  const isWordMarked = useCallback((wordId: string) => {
    return userData.markedWords.some(w => w.wordId === wordId);
  }, [userData.markedWords]);

  // 领养宠物
  const adoptPet = useCallback((type: PetType, name?: string) => {
    const newPet = createPet(type, name);
    setUserData(prev => {
      const newPets = [...prev.petHome.pets, newPet];
      return saveData({
        ...prev,
        petHome: {
          pets: newPets,
          activePetId: newPet.id,
        },
      });
    });
    return newPet;
  }, [saveData]);

  // 领养测试用宠物（可指定任意等级，测试阶段专用）
  const adoptTestPet = useCallback((type: PetType, level: number = 1, name?: string) => {
    const newPet = createTestPet(type, level, name);
    setUserData(prev => {
      const newPets = [...prev.petHome.pets, newPet];
      return saveData({
        ...prev,
        petHome: {
          pets: newPets,
          activePetId: newPet.id,
        },
      });
    });
    return newPet;
  }, [saveData]);

  // 切换当前宠物
  const setActivePet = useCallback((petId: string) => {
    setUserData(prev => {
      if (!prev.petHome.pets.find(p => p.id === petId)) return prev;
      return saveData({
        ...prev,
        petHome: {
          ...prev.petHome,
          activePetId: petId,
        },
      });
    });
  }, [saveData]);

  // 获取当前宠物
  const getActivePet = useCallback((): Pet | null => {
    if (!userData.petHome.activePetId) return null;
    return userData.petHome.pets.find(p => p.id === userData.petHome.activePetId) || null;
  }, [userData.petHome]);

  // 更新宠物数据
  const updatePet = useCallback((petId: string, updates: Partial<Pet>) => {
    setUserData(prev => {
      const newPets = prev.petHome.pets.map(p => 
        p.id === petId ? { ...p, ...updates } : p
      );
      return saveData({
        ...prev,
        petHome: {
          ...prev.petHome,
          pets: newPets,
        },
      });
    });
  }, [saveData]);

  // 喂食宠物
  const feedPet = useCallback((petId: string, itemId: string) => {
    const item = findItemById(itemId);
    if (!item || item.type !== 'food') return false;
    
    const pet = userData.petHome.pets.find(p => p.id === petId);
    if (!pet) return false;

    const newHunger = Math.min(100, pet.hunger + (item.effect.hunger || 0));
    const newExp = pet.exp + (item.effect.exp || 0);
    const newLevel = calculateLevel(newExp);

    updatePet(petId, {
      hunger: newHunger,
      exp: newExp,
      level: newLevel,
      lastFed: Date.now(),
    });

    return true;
  }, [userData.petHome.pets, updatePet]);

  // 陪宠物玩耍
  const playWithPet = useCallback((petId: string, itemId: string) => {
    const item = findItemById(itemId);
    if (!item || item.type !== 'toy') return false;
    
    const pet = userData.petHome.pets.find(p => p.id === petId);
    if (!pet) return false;

    const newHappiness = Math.min(100, pet.happiness + (item.effect.happiness || 0));
    const newExp = pet.exp + (item.effect.exp || 0);
    const newLevel = calculateLevel(newExp);

    updatePet(petId, {
      happiness: newHappiness,
      exp: newExp,
      level: newLevel,
      lastPlayed: Date.now(),
    });

    return true;
  }, [userData.petHome.pets, updatePet]);

  // 添加物品到背包
  const addItem = useCallback((itemId: string, count: number = 1) => {
    setUserData(prev => {
      const newInventory = {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + count,
      };
      return saveData({ ...prev, inventory: newInventory });
    });
  }, [saveData]);

  // 使用物品（从背包移除）
  const useItem = useCallback((itemId: string): boolean => {
    const count = userData.inventory[itemId];
    if (!count || count <= 0) return false;

    setUserData(prev => {
      const newCount = prev.inventory[itemId] - 1;
      const newInventory = { ...prev.inventory };
      if (newCount <= 0) {
        delete newInventory[itemId];
      } else {
        newInventory[itemId] = newCount;
      }
      return saveData({ ...prev, inventory: newInventory });
    });

    return true;
  }, [userData.inventory, saveData]);

  // 获取背包物品数量
  const getItemCount = useCallback((itemId: string): number => {
    return userData.inventory[itemId] || 0;
  }, [userData.inventory]);

  // 兑换物品
  const purchaseItem = useCallback((itemId: string): boolean => {
    const item = findItemById(itemId);
    if (!item) return false;
    if (!spendPoints(item.cost)) return false;
    addItem(itemId);
    return true;
  }, [spendPoints, addItem]);

  // 设置宠物装饰
  const setPetAccessory = useCallback((petId: string, accessory: string | null) => {
    updatePet(petId, { accessory: accessory || undefined });
  }, [updatePet]);

  // 设置宠物背景
  const setPetBackground = useCallback((petId: string, background: string | null) => {
    updatePet(petId, { background: background || undefined });
  }, [updatePet]);

  // 删除宠物
  const removePet = useCallback((petId: string) => {
    setUserData(prev => {
      const newPets = prev.petHome.pets.filter(p => p.id !== petId);
      let newActiveId = prev.petHome.activePetId;
      if (newActiveId === petId) {
        newActiveId = newPets.length > 0 ? newPets[0].id : null;
      }
      return saveData({
        ...prev,
        petHome: {
          pets: newPets,
          activePetId: newActiveId,
        },
      });
    });
  }, [saveData]);

  return {
    userData,
    isLoaded,
    addPoints,
    spendPoints,
    setVoiceEnabled,
    getCurrentLevel,
    getLevelProgress,
    getWordsForReview,
    addWrongQuestion,
    markWrongQuestionCorrect,
    markWordLearned,
    recordWordReview,
    addMarkedWord,
    removeMarkedWord,
    isWordMarked,
    adoptPet,
    adoptTestPet,
    setActivePet,
    getActivePet,
    updatePet,
    feedPet,
    playWithPet,
    addItem,
    useItem,
    getItemCount,
    purchaseItem,
    setPetAccessory,
    setPetBackground,
    removePet,
    PET_LEVELS,
    PET_EMOJIS,
    PET_NAMES,
    PET_FACES,
  };
}
