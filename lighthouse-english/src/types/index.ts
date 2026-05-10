/** 与单词学习中的课本 id 一致：三年级上/下册 */
export type TextbookSemesterId = 'grade3a' | 'grade3b';

// 小动物类型
export type PetType = 'dog' | 'cat' | 'rabbit' | 'bear' | 'fox';

// 小动物等级
export interface PetLevel {
  level: number;
  name: string;
  minExp: number;
  appearance: string;
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

// 用户数据
export interface UserData {
  points: number;
  adoptedPet: PetType | null;
  petExp: number;
  petLevel: number;
  wrongQuestions: WrongQuestion[];
  gameHistory: {
    [gameType: string]: {
      highScore: number;
      playCount: number;
      lastPlay: number;
    };
  };
  voiceEnabled: boolean;
  userItems: Record<string, number>; // 拥有的物品 { itemId: count }
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
  | 'pet';
