import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 随机打乱数组
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 随机选择n个元素
export function pickRandom<T>(array: T[], n: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, n);
}

/** 句子排序：选项统一为小写并去掉标点（展示与判题一致） */
export function normalizeOrderingWord(token: string): string {
  return token
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

// 小动物鼓励语
export const ENCOURAGEMENT_MESSAGES = [
  '这次不小心选错了哟，再想想看~',
  '没关系，继续加油！你可以的！',
  '差一点就对了呢，再试一次吧！',
  '学习就是一个慢慢进步的过程~',
  '别灰心，答案就在眼前哦！',
  '太棒了！继续保持！',
  '你的小动物相信你一定行！',
  '再仔细看看题目吧~',
];

export function getRandomEncouragement(): string {
  return ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
}

// 升级庆祝语
export const LEVEL_UP_MESSAGES: Record<string, string[]> = {
  dog: [
    '你真棒！你的小狗长大了！',
    '汪汪！小狗升级啦！',
    '小狗学会了新技能！',
  ],
  cat: [
    '喵呜~ 小猫咪升级了！',
    '你真棒！你的小猫长大了！',
    '小猫获得了新领结！',
  ],
  rabbit: [
    '你真棒！你的小兔子长大了！',
    '兔兔跳得更高了！',
    '小兔子获得了新萝卜！',
  ],
  bear: [
    '你真棒！你的小熊长大了！',
    '小熊变得更加强壮了！',
    '小熊获得了蜂蜜！',
  ],
  fox: [
    '你真棒！你的小狐狸长大了！',
    '小狐狸更加聪明了！',
    '小狐狸获得了新尾巴！',
  ],
};

export function getLevelUpMessage(petType: string): string {
  const messages = LEVEL_UP_MESSAGES[petType] || LEVEL_UP_MESSAGES.dog;
  return messages[Math.floor(Math.random() * messages.length)];
}

// 计算字符串相似度（Levenshtein距离）
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;
  if (s1 === s2) return 1;

  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return 1 - matrix[len1][len2] / maxLen;
}
