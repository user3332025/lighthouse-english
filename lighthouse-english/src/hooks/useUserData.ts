import { useState, useEffect, useCallback } from 'react';
import { Pet, PetType, PetAcquisition, PetLevel, WrongQuestion, WrongQuestionInput, UserData, PetHome, WordLearningRecord, MarkedWord, REVIEW_INTERVALS, UserDecorations } from '@/types';
import { findItemById, PET_EMOJIS } from '@/data/petItems';

const STORAGE_KEY = 'lighthouse_english_data_v2';

/** 可免费领养的宠物数量上限 */
export const FREE_PET_ADOPTION_LIMIT = 3;

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
function createPet(type: PetType, name?: string, acquisition: PetAcquisition = 'free'): Pet {
  return {
    id: generateId(),
    type,
    acquisition,
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

        // 迁移 wrongQuestions：清理使用 questionId 的旧格式，并去重
        if (migratedData.wrongQuestions && migratedData.wrongQuestions.length > 0) {
          const seen = new Set<string>();
          migratedData.wrongQuestions = migratedData.wrongQuestions
            .map((wq: any) => {
              if (!wq.id && wq.questionId) {
                wq.id = wq.questionId;
              }
              if (wq.question && wq.question.id && !wq.id) {
                wq.id = wq.question.id;
              }
              return wq;
            })
            .filter((wq: any) => {
              if (!wq.id) return false;
              if (seen.has(wq.id)) return false;
              seen.add(wq.id);
              return true;
            });
        }

        // 宠物数据迁移：补齐 acquisition、修正 activePetId、同步学习页 adoptedPet
        if (!migratedData.petHome) {
          migratedData.petHome = { pets: [], activePetId: null };
        }
        migratedData.petHome.pets = (migratedData.petHome.pets || []).map((p: Pet) => ({
          ...p,
          acquisition: (p.acquisition ?? 'free') as PetAcquisition,
        }));
        const petsArr: Pet[] = migratedData.petHome.pets;
        const activeId = migratedData.petHome.activePetId;
        if (activeId && !petsArr.some((p) => p.id === activeId)) {
          migratedData.petHome.activePetId = petsArr[0]?.id ?? null;
        } else if (!activeId && petsArr.length > 0) {
          migratedData.petHome.activePetId = petsArr[0].id;
        }
        const curActive = petsArr.find((p) => p.id === migratedData.petHome.activePetId);
        if (curActive) {
          migratedData.adoptedPet = curActive.type;
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

  const addWrongQuestion = useCallback((question: WrongQuestionInput) => {
    setUserData(prev => {
      const wrongQuestion = question as WrongQuestionInput & Partial<WrongQuestion>;
      const incomingWrongCount = Math.max(1, wrongQuestion.wrongCount ?? 1);
      const incomingCorrectCount = Math.max(0, wrongQuestion.correctCount ?? 0);
      const existing = prev.wrongQuestions.find(
        q => q.id === question.id
      );
      if (existing) {
        const updated = prev.wrongQuestions.map(q =>
          q.id === question.id
            ? {
                ...q,
                wrongCount: q.wrongCount + incomingWrongCount,
                correctCount: q.correctCount + incomingCorrectCount,
                lastAttempt: Date.now(),
              }
            : q
        );
        const newData = { ...prev, wrongQuestions: updated };
        saveData(newData);
        return newData;
      }
      const newData = {
        ...prev,
        wrongQuestions: [
          ...prev.wrongQuestions,
          {
            ...question,
            wrongCount: incomingWrongCount,
            correctCount: incomingCorrectCount,
            lastAttempt: wrongQuestion.lastAttempt ?? Date.now(),
          },
        ],
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
          q => q.id !== questionId
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

  // 剩余免费领养名额
  const getRemainingFreeAdoptionSlots = useCallback((): number => {
    const used = userData.petHome.pets.filter(p => (p.acquisition ?? 'free') === 'free').length;
    return Math.max(0, FREE_PET_ADOPTION_LIMIT - used);
  }, [userData.petHome.pets]);

  // 领养宠物（占用免费名额，最多 FREE_PET_ADOPTION_LIMIT 只）
  const adoptPet = useCallback((type: PetType, name?: string): Pet | null => {
    let newPetResult: Pet | null = null;
    setUserData(prev => {
      if (prev.petHome.pets.some(p => p.type === type)) return prev;
      const freeCount = prev.petHome.pets.filter(p => (p.acquisition ?? 'free') === 'free').length;
      if (freeCount >= FREE_PET_ADOPTION_LIMIT) return prev;
      const newPet = createPet(type, name, 'free');
      newPetResult = newPet;
      const newPets = [...prev.petHome.pets, newPet];
      const newData: UserData = {
        ...prev,
        adoptedPet: type,
        petHome: {
          pets: newPets,
          activePetId: newPet.id,
        },
      };
      saveData(newData);
      return newData;
    });
    return newPetResult;
  }, [saveData]);

  // 商店积分购买宠物（不占免费名额）
  const purchasePetFromShop = useCallback((type: PetType, cost: number): Pet | null => {
    let created: Pet | null = null;
    setUserData(prev => {
      if (prev.points < cost) return prev;
      if (prev.petHome.pets.some(p => p.type === type)) return prev;
      const newPet = createPet(type, undefined, 'purchased');
      created = newPet;
      const newData: UserData = {
        ...prev,
        points: prev.points - cost,
        adoptedPet: type,
        petHome: {
          pets: [...prev.petHome.pets, newPet],
          activePetId: newPet.id,
        },
      };
      saveData(newData);
      return newData;
    });
    return created;
  }, [saveData]);

  const hasAdoptedPetType = useCallback((type: PetType): boolean => {
    return userData.petHome.pets.some(p => p.type === type);
  }, [userData.petHome.pets]);

  // 切换当前宠物
  const setActivePet = useCallback((petId: string) => {
    setUserData(prev => {
      const pet = prev.petHome.pets.find(p => p.id === petId);
      if (!pet) return prev;
      const newData: UserData = {
        ...prev,
        adoptedPet: pet.type,
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
      const activePetObj = newActiveId ? newPets.find(p => p.id === newActiveId) : undefined;
      const newData: UserData = {
        ...prev,
        adoptedPet: activePetObj?.type,
        petHome: {
          pets: newPets,
          activePetId: newActiveId,
        },
      };
      saveData(newData);
      return newData;
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
    unmarkWordLearned,
    recordWordReview,
    addMarkedWord,
    removeMarkedWord,
    isWordMarked,
    adoptPet,
    purchasePetFromShop,
    hasAdoptedPetType,
    getRemainingFreeAdoptionSlots,
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
    PET_LEVELS,
    PET_EMOJIS,
    PET_NAMES,
    PET_FACES,
  };
}
