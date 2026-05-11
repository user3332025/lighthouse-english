import { PetType } from '@/types';

/** 商店可购买的宠物伙伴（积分兑换后可继续培养） */
export interface ShopPetOffer {
  type: PetType;
  /** 中文名称 */
  name: string;
  emoji: string;
  cost: number;
  description: string;
}

export const SHOP_PETS: ShopPetOffer[] = [
  { type: 'dog', name: '小狗狗', emoji: '🐶', cost: 320, description: '忠诚可爱，随时等你回家' },
  { type: 'cat', name: '小猫咪', emoji: '🐱', cost: 320, description: '优雅傲娇，陪你安静学习' },
  { type: 'rabbit', name: '小兔子', emoji: '🐰', cost: 300, description: '软萌活泼，心情会变好' },
  { type: 'bear', name: '小熊', emoji: '🐻', cost: 350, description: '憨厚暖心，像个大抱枕' },
  { type: 'fox', name: '小狐狸', emoji: '🦊', cost: 340, description: '机灵聪明，答题更有劲' },
];
