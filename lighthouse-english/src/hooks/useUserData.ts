import { useState, useEffect, useCallback } from 'react';
import { Pet, PetType, PetLevel, WrongQuestion, WrongQuestionInput, UserData, PetHome, WordLearningRecord, MarkedWord, REVIEW_INTERVALS, UserDecorations } from '@/types';
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

export const PET_LEVEL_EMOJIS: Record<PetType, Record<number, string>> = {
  dog: {
    1: '🐶',
    2: '🐕',
    3: '🦮',
    4: '🐕‍🦺',
    5: '🦮'
  },
  cat: {
    1: '🐱',
    2: '😺',
    3: '😸',
    4: '😼',
    5: '😻'
  },
  rabbit: {
    1: '🐰',
    2: '🐇',
    3: '🐰',
    4: '🐇',
    5: '🐰'
  },
  bear: {
    1: '🐻',
    2: '🧸',
    3: '🐻',
    4: '🐻‍❄️',
    5: '🐼'
  },
  fox: {
    1: '🦊',
    2: '🦝',
    3: '🦊',
    4: '🦝',
    5: '🦊'
  }
};

// 默认装饰和背景数据
const defaultUserDecorations: UserDecorations = {
  ownedAccessories: [],
  ownedBackgrounds: [],
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
  userDecorations: defaultUserDecorations,
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
        
        // 数据迁移逻辑
        let migratedData = { ...defaultUserData, ...parsed };
        
        // 确保 userDecorations 存在且是对象
        if (!migratedData.userDecorations) {
          migratedData.userDecorations = defaultUserDecorations;
        } else if (!migratedData.userDecorations.ownedAccessories) {
          migratedData.userDecorations.ownedAccessories = [];
        } else if (!migratedData.userDecorations.ownedBackgrounds) {
          migratedData.userDecorations.ownedBackgrounds = [];
        }
        
        // 迁移 wordLearningRecords 到新格式
        if (migratedData.wordLearningRecords && migratedData.wordLearningRecords.length > 0) {
          const now = Date.now();
          migratedData.wordLearningRecords = migratedData.wordLearningRecords.map((record: any) => {
            // 如果已经是新格式，直接返回
            if (record.nextReviewAt !== undefined) return record;
            
            // 从旧格式迁移
            const correctCount = record.correctCount || 0;
            const intervalIndex = Math.min(correctCount + 1, REVIEW_INTERVALS.length - 1);
            
            return {
              word: record.word,
              textbookId: record.textbookId || 'grade3a',
              unitId: record.unitId || 1,
              learnedAt: record.learnedAt || now,
              nextReviewAt: now,
              reviewCount: record.reviewCount || 0,
              correctCount: record.correctCount || 0,
              wrongCount: record.wrongCount || 0,
              currentIntervalIndex: intervalIndex,
              isMastered: record.isMastered || false,
            };
          });
        }
        
        setUserData(migratedData);
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
      if (r.isMastered) return false;
      return now >= r.nextReviewAt;
    });
  }, [userData.wordLearningRecords]);

  const addWrongQuestion = useCallback((question: WrongQuestion) => {
    setUserData(prev => {
      const existing = prev.wrongQuestions.find(
        q => q.questionId === question.questionId
      );
      if (existing) return prev;
      const newData = {
        ...prev,
        wrongQuestions: [...prev.wrongQuestions, question],
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const markWrongQuestionCorrect = useCallback((questionId: string) => {
    setUserData(prev => {
      const newData = {
        ...prev,
        wrongQuestions: prev.wrongQuestions.filter(
          q => q.questionId !== questionId
        ),
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const markWordLearned = useCallback((word: string, textbookId: string, unitId: number) => {
    setUserData(prev => {
      const existing = prev.wordLearningRecords.find(r => 
        r.word === word && r.textbookId === textbookId && r.unitId === unitId
      );
      if (existing) return prev;
      const now = Date.now();
      const newData = {
        ...prev,
        wordLearningRecords: [
          ...prev.wordLearningRecords,
          {
            word,
            textbookId,
            unitId,
            learnedAt: now,
            nextReviewAt: now + REVIEW_INTERVALS[1] * 60 * 1000,
            reviewCount: 0,
            correctCount: 0,
            wrongCount: 0,
            currentIntervalIndex: 1,
            isMastered: false,
          },
        ],
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const unmarkWordLearned = useCallback((word: string, textbookId: string, unitId: number) => {
    setUserData(prev => {
      const newData = {
        ...prev,
        wordLearningRecords: prev.wordLearningRecords.filter((r) => 
          !(r.word === word && r.textbookId === textbookId && r.unitId === unitId)
        ),
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const recordWordReview = useCallback((word: string, correct: boolean, textbookId?: string, unitId?: number) => {
    setUserData(prev => {
      const records = [...prev.wordLearningRecords];
      const idx = records.findIndex(r => {
        if (textbookId && unitId) {
          return r.word === word && r.textbookId === textbookId && r.unitId === unitId;
        }
        return r.word === word;
      });
      
      const now = Date.now();
      
      if (idx === -1) {
        // 如果记录不存在，创建新记录
        const newData = {
          ...prev,
          wordLearningRecords: [
            ...records,
            {
              word,
              textbookId: textbookId || 'default',
              unitId: unitId || 0,
              learnedAt: now,
              nextReviewAt: now + REVIEW_INTERVALS[1] * 60 * 1000,
              reviewCount: 1,
              correctCount: correct ? 1 : 0,
              wrongCount: correct ? 0 : 1,
              currentIntervalIndex: 1,
              isMastered: false,
            },
          ],
        };
        saveData(newData);
        return newData;
      }
      
      const record = records[idx];
      let newIntervalIndex = record.currentIntervalIndex;
      let isMastered = record.isMastered;
      
      if (correct) {
        // 答对：进入下一个间隔
        newIntervalIndex = Math.min(record.currentIntervalIndex + 1, REVIEW_INTERVALS.length - 1);
        // 如果已经到了最大间隔，标记为已掌握
        if (newIntervalIndex >= REVIEW_INTERVALS.length - 1) {
          isMastered = true;
        }
      } else {
        // 答错：重置到前面的间隔
        newIntervalIndex = Math.max(1, record.currentIntervalIndex - 2);
      }
      
      records[idx] = {
        ...record,
        reviewCount: record.reviewCount + 1,
        correctCount: record.correctCount + (correct ? 1 : 0),
        wrongCount: record.wrongCount + (correct ? 0 : 1),
        currentIntervalIndex: newIntervalIndex,
        nextReviewAt: now + REVIEW_INTERVALS[newIntervalIndex] * 60 * 1000,
        isMastered,
      };
      
      const newData = { ...prev, wordLearningRecords: records };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const addMarkedWord = useCallback((word: string, textbookId: string, unitId: number, meaning: string, phonetic: string) => {
    setUserData(prev => {
      // 先清理旧格式的数据
      const cleanedMarkedWords = prev.markedWords.filter(w => !(w as any).wordId);
      
      const existing = cleanedMarkedWords.find(
        w => w.word === word && w.textbookId === textbookId && w.unitId === unitId
      );
      if (existing) return prev;
      
      const newMarkedWord: MarkedWord = {
        word,
        textbookId,
        unitId,
        markedAt: Date.now(),
        meaning,
        phonetic
      };
      const newData = {
        ...prev,
        markedWords: [...cleanedMarkedWords, newMarkedWord],
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const removeMarkedWord = useCallback((word: string, textbookId: string, unitId: number) => {
    setUserData(prev => {
      const newData = {
        ...prev,
        markedWords: prev.markedWords.filter(w => {
          // 兼容旧格式（只有wordId的情况）
          if ((w as any).wordId) {
            return (w as any).wordId !== word;
          }
          // 新格式检查
          return !(w.word === word && w.textbookId === textbookId && w.unitId === unitId);
        }),
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const isWordMarked = useCallback((word: string, textbookId: string, unitId: number) => {
    return userData.markedWords.some(w => {
      // 兼容旧格式（只有wordId的情况）
      if ((w as any).wordId) {
        return (w as any).wordId === word;
      }
      // 新格式检查
      return w.word === word && w.textbookId === textbookId && w.unitId === unitId;
    });
  }, [userData.markedWords]);

  // 领养宠物
  const adoptPet = useCallback((type: PetType, name?: string) => {
    const newPet = createPet(type, name);
    setUserData(prev => {
      const newPets = [...prev.petHome.pets, newPet];
      const newData = {
        ...prev,
        petHome: {
          pets: newPets,
          activePetId: newPet.id,
        },
      };
      saveData(newData);
      return newData;
    });
    return newPet;
  }, [saveData]);

  // 领养测试用宠物（可指定任意等级，测试阶段专用）
  const adoptTestPet = useCallback((type: PetType, level: number = 1, name?: string) => {
    const newPet = createTestPet(type, level, name);
    setUserData(prev => {
      const newPets = [...prev.petHome.pets, newPet];
      const newData = {
        ...prev,
        petHome: {
          pets: newPets,
          activePetId: newPet.id,
        },
      };
      saveData(newData);
      return newData;
    });
    return newPet;
  }, [saveData]);

  // 切换当前宠物
  const setActivePet = useCallback((petId: string) => {
    setUserData(prev => {
      if (!prev.petHome.pets.find(p => p.id === petId)) return prev;
      const newData = {
        ...prev,
        petHome: {
          ...prev.petHome,
          activePetId: petId,
        },
      };
      saveData(newData);
      return newData;
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
      const newData = {
        ...prev,
        petHome: {
          ...prev.petHome,
          pets: newPets,
        },
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  // 添加物品到背包
  const addItem = useCallback((itemId: string, count: number = 1) => {
    setUserData(prev => {
      const newInventory = {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + count,
      };
      const newData = { ...prev, inventory: newInventory };
      saveData(newData);
      return newData;
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
      const newData = { ...prev, inventory: newInventory };
      saveData(newData);
      return newData;
    });

    return true;
  }, [userData.inventory, saveData]);

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

  // 获取背包物品数量
  const getItemCount = useCallback((itemId: string): number => {
    return userData.inventory[itemId] || 0;
  }, [userData.inventory]);

  // 检查是否已拥有某个装饰或背景
  const ownsItem = useCallback((itemId: string): boolean => {
    const item = findItemById(itemId);
    if (!item) return false;
    
    if (item.type === 'accessory') {
      return userData.userDecorations.ownedAccessories.includes(itemId);
    }
    if (item.type === 'background') {
      return userData.userDecorations.ownedBackgrounds.includes(itemId);
    }
    // 食物和玩具不受此限制
    return false;
  }, [userData.userDecorations]);

  // 兑换物品
  const purchaseItem = useCallback((itemId: string): boolean => {
    const item = findItemById(itemId);
    if (!item) return false;
    
    // 如果是装饰或背景，检查是否已拥有
    if (item.type === 'accessory' || item.type === 'background') {
      if (ownsItem(itemId)) {
        return false; // 已拥有，不能重复购买
      }
    }
    
    if (!spendPoints(item.cost)) return false;
    
    // 根据类型处理
    if (item.type === 'accessory') {
      // 购买装饰，添加到已拥有列表
      setUserData(prev => {
        const newData = {
          ...prev,
          userDecorations: {
            ...prev.userDecorations,
            ownedAccessories: [...prev.userDecorations.ownedAccessories, itemId],
          }
        };
        saveData(newData);
        return newData;
      });
    } else if (item.type === 'background') {
      // 购买背景，添加到已拥有列表
      setUserData(prev => {
        const newData = {
          ...prev,
          userDecorations: {
            ...prev.userDecorations,
            ownedBackgrounds: [...prev.userDecorations.ownedBackgrounds, itemId],
          }
        };
        saveData(newData);
        return newData;
      });
    } else {
      // 食物和玩具正常添加到背包
      addItem(itemId);
    }
    
    return true;
  }, [spendPoints, addItem, ownsItem, saveData]);

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
      const newData = {
        ...prev,
        petHome: {
          pets: newPets,
          activePetId: newActiveId,
        },
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  // 测试模式：添加大量积分
  const addTestPoints = (amount: number = 1000) => {
    setUserData(prev => {
      const newData = { ...prev, points: prev.points + amount };
      saveData(newData);
      return newData;
    });
  };

  // 测试模式：添加所有物品到背包
  const addAllTestItems = () => {
    setUserData(prev => {
      const newInventory = { ...prev.inventory };
      // 添加所有食物和玩具
      ['apple', 'banana', 'carrot', 'meat', 'fish', 'milk', 'cookie', 'cake', 
       'ball', 'rope', 'bone', 'feather', 'yarn', 'bell', 'mouse', 'laser'].forEach(itemId => {
        newInventory[itemId] = (newInventory[itemId] || 0) + 10;
      });
      const newData = { ...prev, inventory: newInventory };
      saveData(newData);
      return newData;
    });
  };

  // 测试模式：解锁所有装饰品和背景
  const unlockAllTestDecorations = () => {
    setUserData(prev => {
      const newData = {
        ...prev,
        userDecorations: {
          ownedAccessories: ['crown', 'bow', 'hat', 'glasses', 'necklace', 'flower', 'star', 'heart'],
          ownedBackgrounds: ['meadow', 'sunset', 'night', 'rainbow', 'beach', 'mountain', 'garden', 'space'],
        }
      };
      saveData(newData);
      return newData;
    });
  };

  // 测试模式：重置所有数据
  const resetAllData = () => {
    setUserData(defaultUserData);
    localStorage.removeItem(STORAGE_KEY);
  };

  // 测试模式：快速标记单词已学习
  const markTestWordLearned = () => {
    setUserData(prev => {
      const newRecords = [...prev.wordLearningRecords];
      // 添加一些测试单词记录
      const testWords = [
        { word: 'apple', textbookId: 'grade3a', unitId: 1 },
        { word: 'banana', textbookId: 'grade3a', unitId: 1 },
        { word: 'cat', textbookId: 'grade3a', unitId: 2 },
        { word: 'dog', textbookId: 'grade3a', unitId: 2 },
      ];
      const now = Date.now();
      testWords.forEach(testWord => {
        const existing = newRecords.find(r => 
          r.word === testWord.word && r.textbookId === testWord.textbookId && r.unitId === testWord.unitId
        );
        if (!existing) {
          newRecords.push({
            ...testWord,
            learnedAt: now,
            nextReviewAt: now,
            reviewCount: 0,
            correctCount: 5,
            wrongCount: 0,
            currentIntervalIndex: REVIEW_INTERVALS.length - 1,
            isMastered: true,
          });
        }
      });
      const newData = { ...prev, wordLearningRecords: newRecords };
      saveData(newData);
      return newData;
    });
  };

  // 测试模式：给当前宠物添加经验升级
  const addTestPetExp = (amount: number = 500) => {
    const activePet = getActivePet();
    if (activePet) {
      updatePet(activePet.id, { exp: activePet.exp + amount });
    }
  };

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
    unmarkWordLearned,
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
    ownsItem,
    setPetAccessory,
    setPetBackground,
    removePet,
    // 测试模式功能
    addTestPoints,
    addAllTestItems,
    unlockAllTestDecorations,
    resetAllData,
    markTestWordLearned,
    addTestPetExp,
    PET_LEVELS,
    PET_EMOJIS,
    PET_NAMES,
    PET_FACES,
  };
}
