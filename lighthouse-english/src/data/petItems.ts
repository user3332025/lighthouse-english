import { Item } from '@/types';
import { PetType } from '@/types';

export const PET_EMOJIS: Record<PetType, string> = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  bear: '🐻',
  fox: '🦊',
};

export const PET_FOODS: Item[] = [
  // 小零食（糖果、饼干类）
  { id: 'cookie', name: '曲奇饼干', emoji: '🍪', cost: 18, category: 'snack', type: 'food', effect: { hunger: 25, exp: 6 } },
  { id: 'candy', name: '糖果', emoji: '🍬', cost: 10, category: 'snack', type: 'food', effect: { hunger: 15, exp: 3 } },
  { id: 'lollipop', name: '棒棒糖', emoji: '🍭', cost: 15, category: 'snack', type: 'food', effect: { hunger: 20, exp: 5 } },
  { id: 'ice-cream', name: '冰淇淋', emoji: '🍦', cost: 20, category: 'snack', type: 'food', effect: { hunger: 22, exp: 6 } },
  
  // 水果类
  { id: 'apple', name: '红苹果', emoji: '🍎', cost: 15, category: 'fruit', type: 'food', effect: { hunger: 20, exp: 5 } },
  { id: 'banana', name: '香蕉', emoji: '🍌', cost: 12, category: 'fruit', type: 'food', effect: { hunger: 18, exp: 4 } },
  { id: 'grape', name: '葡萄', emoji: '🍇', cost: 18, category: 'fruit', type: 'food', effect: { hunger: 25, exp: 7 } },
  { id: 'watermelon', name: '西瓜', emoji: '🍉', cost: 25, category: 'fruit', type: 'food', effect: { hunger: 35, exp: 8 } },
  { id: 'strawberry', name: '草莓', emoji: '🍓', cost: 22, category: 'fruit', type: 'food', effect: { hunger: 28, exp: 7 } },
  { id: 'orange', name: '橙子', emoji: '🍊', cost: 20, category: 'fruit', type: 'food', effect: { hunger: 30, exp: 7 } },
  { id: 'cherry', name: '樱桃', emoji: '🍒', cost: 28, category: 'fruit', type: 'food', effect: { hunger: 32, exp: 8 } },
  { id: 'peach', name: '桃子', emoji: '🍑', cost: 22, category: 'fruit', type: 'food', effect: { hunger: 28, exp: 7 } },
  
  // 正餐类
  { id: 'fish', name: '小鱼', emoji: '🐟', cost: 35, category: 'meal', type: 'food', effect: { hunger: 50, exp: 12 } },
  { id: 'meat', name: '肉排', emoji: '🥩', cost: 40, category: 'meal', type: 'food', effect: { hunger: 55, exp: 14 } },
  { id: 'bone', name: '大骨头', emoji: '🦴', cost: 30, category: 'meal', type: 'food', effect: { hunger: 45, exp: 10 } },
  { id: 'poultry', name: '鸡肉', emoji: '🍗', cost: 38, category: 'meal', type: 'food', effect: { hunger: 52, exp: 13 } },
  { id: 'milk', name: '牛奶', emoji: '🥛', cost: 25, category: 'meal', type: 'food', effect: { hunger: 40, exp: 10 } },
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', cost: 15, category: 'meal', type: 'food', effect: { hunger: 30, exp: 8 } },
  { id: 'egg', name: '鸡蛋', emoji: '🥚', cost: 20, category: 'meal', type: 'food', effect: { hunger: 35, exp: 9 } },
  { id: 'rice', name: '米饭', emoji: '🍚', cost: 22, category: 'meal', type: 'food', effect: { hunger: 38, exp: 10 } },
];

export const PET_TOYS: Item[] = [
  // 球类玩具
  { id: 'ball', name: '小皮球', emoji: '⚽', cost: 30, category: 'ball', type: 'toy', effect: { happiness: 25, exp: 8 } },
  { id: 'basketball', name: '篮球', emoji: '🏀', cost: 35, category: 'ball', type: 'toy', effect: { happiness: 28, exp: 10 } },
  { id: 'tennis', name: '网球', emoji: '🎾', cost: 25, category: 'ball', type: 'toy', effect: { happiness: 22, exp: 7 } },
  { id: 'baseball', name: '棒球', emoji: '⚾', cost: 32, category: 'ball', type: 'toy', effect: { happiness: 26, exp: 9 } },
  { id: 'volleyball', name: '排球', emoji: '🏐', cost: 28, category: 'ball', type: 'toy', effect: { happiness: 24, exp: 8 } },
  
  // 玩偶类
  { id: 'teddy-bear', name: '泰迪熊', emoji: '🧸', cost: 50, category: 'plush', type: 'toy', effect: { happiness: 40, exp: 15 } },
  { id: 'doll', name: '布娃娃', emoji: '👶', cost: 45, category: 'plush', type: 'toy', effect: { happiness: 38, exp: 14 } },
  { id: 'ducky', name: '小黄鸭', emoji: '🦆', cost: 35, category: 'plush', type: 'toy', effect: { happiness: 32, exp: 12 } },
  { id: 'bunny', name: '兔兔玩偶', emoji: '🐰', cost: 48, category: 'plush', type: 'toy', effect: { happiness: 38, exp: 14 } },
  
  // 游戏类玩具
  { id: 'frisbee', name: '飞盘', emoji: '🥏', cost: 40, category: 'game', type: 'toy', effect: { happiness: 35, exp: 12 } },
  { id: 'kite', name: '风筝', emoji: '🪁', cost: 45, category: 'game', type: 'toy', effect: { happiness: 38, exp: 13 } },
  { id: 'yo-yo', name: '溜溜球', emoji: '🔴', cost: 30, category: 'game', type: 'toy', effect: { happiness: 28, exp: 10 } },
  { id: 'puzzle', name: '拼图', emoji: '🧩', cost: 50, category: 'game', type: 'toy', effect: { happiness: 42, exp: 16 } },
  { id: 'blocks', name: '积木', emoji: '🧱', cost: 55, category: 'game', type: 'toy', effect: { happiness: 45, exp: 18 } },
];

export const PET_ACCESSORIES: Item[] = [
  // 皇冠类
  { id: 'crown-gold', name: '金色皇冠', emoji: '👑', cost: 150, category: 'crown', type: 'accessory', effect: { exp: 20 } },
  { id: 'crown-silver', name: '银色皇冠', emoji: '👸', cost: 120, category: 'crown', type: 'accessory', effect: { exp: 18 } },
  
  // 帽子类
  { id: 'hat-top', name: '绅士礼帽', emoji: '🎩', cost: 100, category: 'hat', type: 'accessory', effect: { exp: 15 } },
  { id: 'hat-wizard', name: '魔法帽', emoji: '🧙', cost: 130, category: 'hat', type: 'accessory', effect: { exp: 18 } },
  { id: 'hat-cap', name: '鸭舌帽', emoji: '🧢', cost: 80, category: 'hat', type: 'accessory', effect: { exp: 12 } },
  
  // 眼镜类
  { id: 'glasses-normal', name: '斯文眼镜', emoji: '👓', cost: 70, category: 'glasses', type: 'accessory', effect: { exp: 10 } },
  { id: 'glasses-sunglass', name: '炫酷墨镜', emoji: '🕶️', cost: 90, category: 'glasses', type: 'accessory', effect: { exp: 14 } },
  { id: 'glasses-nerd', name: '黑框眼镜', emoji: '🤓', cost: 75, category: 'glasses', type: 'accessory', effect: { exp: 12 } },
  
  // 蝴蝶结类
  { id: 'bow-pink', name: '粉色蝴蝶结', emoji: '🎀', cost: 85, category: 'bow', type: 'accessory', effect: { exp: 13 } },
  { id: 'bow-red', name: '红色蝴蝶结', emoji: '🔴', cost: 85, category: 'bow', type: 'accessory', effect: { exp: 13 } },
];

export const PET_BACKGROUNDS: Item[] = [
  // 自然类
  { 
    id: 'bg-forest', 
    name: '森林小径', 
    emoji: '🌲', 
    cost: 200, 
    category: 'nature', 
    type: 'background', 
    effect: { exp: 25 },
    bgStyle: 'bg-gradient-to-br from-green-300 via-emerald-400 to-teal-500'
  },
  { 
    id: 'bg-beach', 
    name: '阳光沙滩', 
    emoji: '🏖️', 
    cost: 220, 
    category: 'nature', 
    type: 'background', 
    effect: { exp: 28 },
    bgStyle: 'bg-gradient-to-br from-blue-300 via-cyan-400 to-amber-300'
  },
  { 
    id: 'bg-mountain', 
    name: '雪山云海', 
    emoji: '🏔️', 
    cost: 250, 
    category: 'nature', 
    type: 'background', 
    effect: { exp: 30 },
    bgStyle: 'bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-400'
  },
  
  // 太空类
  { 
    id: 'bg-space', 
    name: '星际探险', 
    emoji: '🚀', 
    cost: 300, 
    category: 'space', 
    type: 'background', 
    effect: { exp: 35 },
    bgStyle: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900'
  },
  { 
    id: 'bg-moon', 
    name: '月球漫步', 
    emoji: '🌕', 
    cost: 280, 
    category: 'space', 
    type: 'background', 
    effect: { exp: 32 },
    bgStyle: 'bg-gradient-to-br from-slate-700 via-gray-800 to-slate-900'
  },
  
  // 奇幻类
  { 
    id: 'bg-rainbow', 
    name: '彩虹天堂', 
    emoji: '🌈', 
    cost: 260, 
    category: 'fantasy', 
    type: 'background', 
    effect: { exp: 30 },
    bgStyle: 'bg-gradient-to-br from-red-400 via-yellow-400 to-blue-500'
  },
  { 
    id: 'bg-candy', 
    name: '糖果王国', 
    emoji: '🍭', 
    cost: 270, 
    category: 'fantasy', 
    type: 'background', 
    effect: { exp: 31 },
    bgStyle: 'bg-gradient-to-br from-pink-300 via-purple-300 to-yellow-300'
  },
  { 
    id: 'bg-magic', 
    name: '魔法森林', 
    emoji: '✨', 
    cost: 290, 
    category: 'fantasy', 
    type: 'background', 
    effect: { exp: 33 },
    bgStyle: 'bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600'
  },
];

export const PET_ITEMS = {
  food: PET_FOODS,
  toy: PET_TOYS,
  accessory: PET_ACCESSORIES,
  background: PET_BACKGROUNDS,
};

export function findItemById(id: string): Item | undefined {
  return PET_FOODS.find(item => item.id === id) 
    || PET_TOYS.find(item => item.id === id)
    || PET_ACCESSORIES.find(item => item.id === id)
    || PET_BACKGROUNDS.find(item => item.id === id);
}
