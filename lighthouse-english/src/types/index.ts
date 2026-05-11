/** 与单词学习中的课本 id 一致：三年级上/下册 */
export type TextbookSemesterId = 'grade3a' | 'grade3b';

// 小动物类型
export type PetType = 'dog' | 'cat' | 'rabbit' | 'bear' | 'fox';

// 单个宠物数据
export interface Pet {
  id: string;
  type: PetType;
  name: string;
  level: number;
  exp: number;
  hunger: number; // 饥饿值 0-100，0=很饿，100=吃饱
  happiness: number; // 快乐值 0-100，0=不开心，100=很开心
  lastFed: number; // 最后喂食时间戳
  lastPlayed: number; // 最后玩耍时间戳
  adoptedAt: number; // 领养时间
  accessory?: string; // 当前装饰
  background?: string; // 当前背景
}

// 宠物小窝数据
export interface PetHome {
  pets: Pet[];
  activePetId: string | null;
}

// 小动物等级
export interface PetLevel {
  level: number;
  name: string;
  minExp: number;
  appearance: string;
}

// 食物类型
export type FoodCategory = 'snack' | 'fruit' | 'meal';

// 玩具类型
export type ToyCategory = 'ball' | 'plush' | 'game';

// 装饰配件类型
export type AccessoryCategory = 'crown' | 'hat' | 'glasses' | 'bow';

// 背景装饰类型
export type BackgroundCategory = 'nature' | 'space' | 'fantasy';

// 物品类型
export interface Item {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  category: FoodCategory | ToyCategory | AccessoryCategory | BackgroundCategory;
  type: 'food' | 'toy' | 'accessory' | 'background';
  effect: {
    hunger?: number; // 恢复饥饿值
    happiness?: number; // 增加快乐值
    exp?: number; // 增加经验值
  };
  // 背景专属：CSS样式，用于渲染宠物小窝背景
  bgStyle?: string;
}

// 用户装饰和背景数据
export interface UserDecorations {
  ownedAccessories: string[]; // 已拥有的装饰ID列表
  ownedBackgrounds: string[]; // 已拥有的背景ID列表
}

// 游戏进度
export interface GameProgress {
  questionIndex: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
}

// 答题结果
export interface AnswerResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  timestamp: number;
}

/** 写入错题本时只需 id / type / question；计数与时间戳由 store 填充 */
export interface WrongQuestionInput {
  id: string;
  type: 'phonetic' | 'sentence' | 'dialogue' | 'listening' | 'matching' | 'ordering';
  question: QuestionData;
}

// 错题记录（持久化后的完整结构）
export interface WrongQuestion extends WrongQuestionInput {
  wrongCount: number;
  correctCount: number;
  lastAttempt: number;
}

// 题目数据基础接口（含各题型可能用到的可选字段，便于错题本与复习页统一处理）
export interface QuestionData {
  id: string;
  type: string;
  question?: string;
  options?: string[];
  correctAnswer: string;
  image?: string;
  audio?: string;
  scenario?: string;
  scene?: string;
  context?: string;
  images?: string[];
  audioText?: string;
  word?: string;
  shuffledSentences?: string[];
  correctOrder?: number[];
  mode?: string;
  topic?: string;
}

// 音标题目
export interface PhoneticQuestion extends QuestionData {
  phonetic: string;
  examples: {
    word: string;
    image: string;
    audio: string;
  }[];
}

// 句型练习题目
export interface SentenceQuestion extends QuestionData {
  scenario: string;
  image: string;
}

// 对话练习题目
export interface DialogueQuestion extends QuestionData {
  scene: string;
  image: string;
  context: string;
}

// 听力选择题目
export interface ListeningQuestion extends QuestionData {
  audioText: string;
  images: string[];
}

// 拼写匹配题目
export interface MatchingQuestion extends QuestionData {
  word: string;
  image: string;
  audioText: string;
  mode: 'word-to-picture' | 'audio-to-word' | 'picture-to-word';
  topic: string;
}

// 句子排序题目
export interface OrderingQuestion extends QuestionData {
  scene: string;
  image: string;
  shuffledSentences: string[];
  correctOrder: number[];
}

// 复习间隔时间（分钟）- 艾宾浩斯遗忘曲线
export const REVIEW_INTERVALS = [0, 0, 30, 1440, 2880, 5760, 10080, 21600]; // 0分钟(立刻), 立刻, 30分钟, 1天, 2天, 4天, 7天, 15天

// 单词学习记录
export interface WordLearningRecord {
  word: string;
  textbookId: string;
  unitId: number;
  learnedAt: number;
  nextReviewAt: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  currentIntervalIndex: number; // 当前复习间隔索引
  isMastered: boolean; // 是否已掌握
}

// 重点词标记
export interface MarkedWord {
  word: string;
  textbookId: string;
  unitId: number;
  markedAt: number;
  meaning: string;
  phonetic: string;
}

// 用户数据
export interface UserData {
  points: number;
  wrongQuestions: WrongQuestion[];
  gameHistory: {
    [gameType: string]: {
      highScore: number;
      playCount: number;
      lastPlay: number;
    };
  };
  voiceEnabled: boolean;
  inventory: Record<string, number>; // 背包物品 { itemId: count }
  wordLearningRecords: WordLearningRecord[]; // 单词学习记录
  markedWords: MarkedWord[]; // 生词本/重点词
  petHome: PetHome; // 宠物小窝
  userDecorations: UserDecorations; // 用户装饰和背景
  completedQuizzes?: {
    dialogue: number;
    sentence: number;
    listening: number;
    matching: number;
    ordering: number;
  };
}

// 食物偏好类型
export type FoodPreference = 'favorite' | 'good' | 'neutral' | 'bad';

// 宠物食物偏好配置
export interface PetFoodPreferences {
  [petType: string]: {
    [itemId: string]: FoodPreference;
  };
}

// 页面路由
export type PageType = 
  | 'home'
  | 'phonetic'
  | 'sentence'
  | 'review'
  | 'dialogue'
  | 'games'
  | 'listening'
  | 'matching'
  | 'ordering'
  | 'pet'
  | 'shop';
