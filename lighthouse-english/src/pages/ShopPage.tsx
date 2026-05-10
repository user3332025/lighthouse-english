import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUserData } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';
import { Star, Package } from 'lucide-react';
import { FoodPreference } from '@/types';

export type ShopCategory = 'food' | 'animals' | 'accessories' | 'nature';

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
}

export const SHOP_ITEMS: Record<ShopCategory, ShopItem[]> = {
  food: [
    // 水果类
    { id: 'apple', name: '红苹果', emoji: '🍎', cost: 20, description: '新鲜的红苹果' },
    { id: 'green-apple', name: '青苹果', emoji: '🍏', cost: 20, description: '酸酸甜甜' },
    { id: 'banana', name: '香蕉', emoji: '🍌', cost: 18, description: '弯弯的香蕉' },
    { id: 'orange', name: '橙子', emoji: '🍊', cost: 22, description: '甜甜的橙子' },
    { id: 'grape', name: '葡萄', emoji: '🍇', cost: 25, description: '紫色的美味' },
    { id: 'watermelon', name: '西瓜', emoji: '🍉', cost: 32, description: '夏日清凉' },
    { id: 'cherry', name: '樱桃', emoji: '🍒', cost: 30, description: '红红的甜甜' },
    { id: 'strawberry', name: '草莓', emoji: '🍓', cost: 28, description: '香香甜甜' },
    { id: 'peach', name: '桃子', emoji: '🍑', cost: 26, description: '粉粉嫩嫩' },
    { id: 'lemon', name: '柠檬', emoji: '🍋', cost: 18, description: '酸酸的味道' },
    { id: 'mango', name: '芒果', emoji: '🥭', cost: 30, description: '香甜的芒果' },
    { id: 'pineapple', name: '菠萝', emoji: '🍍', cost: 28, description: '热带风味' },
    { id: 'coconut', name: '椰子', emoji: '🥥', cost: 25, description: '清凉解渴' },
    { id: 'pear', name: '梨', emoji: '🍐', cost: 20, description: '水润多汁' },
    // 蔬菜类
    { id: 'carrot', name: '胡萝卜', emoji: '🥕', cost: 15, description: '小动物最爱' },
    { id: 'corn', name: '玉米', emoji: '🌽', cost: 18, description: '金黄的玉米' },
    { id: 'eggplant', name: '茄子', emoji: '🍆', cost: 16, description: '紫色的蔬菜' },
    { id: 'tomato', name: '番茄', emoji: '🍅', cost: 18, description: '红红的番茄' },
    { id: 'broccoli', name: '西兰花', emoji: '🥦', cost: 20, description: '营养丰富' },
    { id: 'potato', name: '土豆', emoji: '🥔', cost: 15, description: '圆圆的土豆' },
    { id: 'sweet-potato', name: '红薯', emoji: '🍠', cost: 18, description: '甜甜的红薯' },
    { id: 'mushroom', name: '蘑菇', emoji: '🍄', cost: 16, description: '森林的宝贝' },
    { id: 'garlic', name: '大蒜', emoji: '🧄', cost: 12, description: '调味必备' },
    { id: 'onion', name: '洋葱', emoji: '🧅', cost: 14, description: '层次分明' },
    { id: 'pepper', name: '辣椒', emoji: '🌶️', cost: 15, description: '辣辣的' },
    { id: 'chili', name: '朝天椒', emoji: '🔴', cost: 12, description: '特别辣' },
    { id: 'cucumber', name: '黄瓜', emoji: '🥒', cost: 15, description: '清爽脆口' },
    { id: 'avocado', name: '牛油果', emoji: '🥑', cost: 28, description: '营养丰富' },
    // 肉类
    { id: 'fish', name: '小鱼', emoji: '🐟', cost: 30, description: '鲜美的鱼' },
    { id: 'fish-cake', name: '鱼丸', emoji: '🍥', cost: 22, description: 'Q弹鱼丸' },
    { id: 'shrimp', name: '大虾', emoji: '🦐', cost: 40, description: '鲜美大虾' },
    { id: 'crab', name: '螃蟹', emoji: '🦀', cost: 50, description: '横行霸道' },
    { id: 'meat', name: '肉', emoji: '🥩', cost: 35, description: '新鲜的肉' },
    { id: 'bone', name: '大骨头', emoji: '🦴', cost: 25, description: '狗狗的最爱' },
    { id: 'poultry', name: '鸡肉', emoji: '🍗', cost: 30, description: '香嫩鸡肉' },
    // 饮品类
    { id: 'milk', name: '牛奶', emoji: '🥛', cost: 20, description: '营养又健康' },
    { id: 'juice', name: '果汁', emoji: '🧃', cost: 25, description: '新鲜果汁' },
    { id: 'tea', name: '奶茶', emoji: '🧋', cost: 28, description: '香浓好喝' },
    { id: 'coffee', name: '咖啡', emoji: '☕', cost: 30, description: '提神醒脑' },
    { id: 'sake', name: '清酒', emoji: '🍶', cost: 35, description: '日本清酒' },
    { id: 'beer', name: '啤酒', emoji: '🍺', cost: 25, description: '冰爽啤酒' },
    // 甜品类
    { id: 'ice-cream', name: '冰淇淋', emoji: '🍦', cost: 35, description: '甜甜的夏日必备' },
    { id: 'cake', name: '蛋糕', emoji: '🎂', cost: 60, description: '生日蛋糕' },
    { id: 'cupcake', name: '纸杯蛋糕', emoji: '🧁', cost: 28, description: '精致可爱' },
    { id: 'pie', name: '水果派', emoji: '🥧', cost: 35, description: '甜蜜的派' },
    { id: 'donut', name: '甜甜圈', emoji: '🍩', cost: 30, description: '甜甜圈圈' },
    { id: 'cookie', name: '曲奇饼干', emoji: '🍪', cost: 22, description: '酥脆曲奇' },
    { id: 'chocolate', name: '巧克力', emoji: '🍫', cost: 40, description: '香浓丝滑' },
    { id: 'candy', name: '糖果', emoji: '🍬', cost: 15, description: '甜甜的小零食' },
    { id: 'lollipop', name: '棒棒糖', emoji: '🍭', cost: 18, description: '转转转' },
    { id: 'doughnut', name: '炸面圈', emoji: '🍩', cost: 25, description: '外酥里软' },
    // 主食类
    { id: 'rice', name: '米饭', emoji: '🍚', cost: 20, description: '香喷喷的米饭' },
    { id: 'bread', name: '面包', emoji: '🍞', cost: 18, description: '松软的面包' },
    { id: 'croissant', name: '牛角包', emoji: '🥐', cost: 28, description: '酥脆可口' },
    { id: 'pancake', name: '煎饼', emoji: '🥞', cost: 25, description: '软软的煎饼' },
    { id: 'waffle', name: '华夫饼', emoji: '🧇', cost: 30, description: '格子脆脆' },
    { id: 'noodles', name: '面条', emoji: '🍜', cost: 25, description: '滑溜溜的面条' },
    { id: 'spaghetti', name: '意大利面', emoji: '🍝', cost: 35, description: '西式风味' },
    { id: 'ramen', name: '拉面', emoji: '🍜', cost: 40, description: '日式拉面' },
    { id: 'dumpling', name: '饺子', emoji: '🥟', cost: 30, description: '中国美食' },
    { id: 'sushi', name: '寿司', emoji: '🍣', cost: 45, description: '日式寿司' },
    { id: 'bento', name: '便当', emoji: '🍱', cost: 50, description: '精致便当' },
    { id: 'egg', name: '鸡蛋', emoji: '🥚', cost: 15, description: '营养早餐' },
    { id: 'fried-egg', name: '煎蛋', emoji: '🍳', cost: 20, description: '金黄煎蛋' },
    // 快餐类
    { id: 'pizza', name: '披萨', emoji: '🍕', cost: 50, description: '美味的披萨' },
    { id: 'burger', name: '汉堡', emoji: '🍔', cost: 45, description: '香喷喷' },
    { id: 'hotdog', name: '热狗', emoji: '🌭', cost: 35, description: '快捷美味' },
    { id: 'fries', name: '薯条', emoji: '🍟', cost: 30, description: '脆脆的薯条' },
    { id: 'taco', name: '塔可', emoji: '🌮', cost: 38, description: '墨西哥风味' },
    { id: 'burrito', name: '墨西哥卷', emoji: '🌯', cost: 40, description: '满满的馅' },
    { id: 'sandwich', name: '三明治', emoji: '🥪', cost: 28, description: '方便快捷' },
    { id: 'kebab', name: '烤肉串', emoji: '🍢', cost: 35, description: '香喷喷的烤肉' },
    { id: 'rice-ball', name: '饭团', emoji: '🍙', cost: 25, description: '日式饭团' },
    { id: 'rice-cake', name: '年糕', emoji: '🍡', cost: 22, description: '软糯年糕' },
    // 小吃类
    { id: 'popcorn', name: '爆米花', emoji: '🍿', cost: 25, description: '看电影必备' },
    { id: 'nuts', name: '坚果', emoji: '🥜', cost: 30, description: '营养坚果' },
    { id: 'chestnut', name: '栗子', emoji: '🌰', cost: 22, description: '香甜的栗子' },
    { id: 'salt', name: '盐', emoji: '🧂', cost: 10, description: '调味料' },
    { id: 'honey', name: '蜂蜜', emoji: '🍯', cost: 35, description: '甜甜的蜂蜜' },
    { id: 'butter', name: '黄油', emoji: '🧈', cost: 20, description: '奶香浓郁' },
    { id: 'cheese', name: '奶酪', emoji: '🧀', cost: 25, description: '浓郁奶香' },
    { id: 'soup', name: '浓汤', emoji: '🍲', cost: 35, description: '暖暖的汤' },
    { id: 'curry', name: '咖喱饭', emoji: '🍛', cost: 38, description: '异国风味' },
    { id: 'stew', name: '炖菜', emoji: '🥘', cost: 40, description: '暖心炖菜' },
    { id: 'pot', name: '火锅', emoji: '🍲', cost: 60, description: '热闹火锅' },
    { id: 'paella', name: '海鲜饭', emoji: '🥘', cost: 55, description: '西班牙风味' },
  ],
  animals: [
    // 宠物类
    { id: 'dog', name: '小狗狗', emoji: '🐶', cost: 100, description: '忠诚的小伙伴' },
    { id: 'cat', name: '小猫咪', emoji: '🐱', cost: 100, description: '可爱的小猫' },
    { id: 'hamster', name: '小仓鼠', emoji: '🐹', cost: 85, description: '圆滚滚的小仓鼠' },
    { id: 'rabbit', name: '小兔子', emoji: '🐰', cost: 90, description: '蹦蹦跳跳' },
    { id: 'bunny', name: '小兔兔', emoji: '🐇', cost: 85, description: '软萌兔兔' },
    { id: 'mouse', name: '小老鼠', emoji: '🐭', cost: 65, description: '小巧机灵' },
    { id: 'hamster2', name: '仓鼠', emoji: '🐹', cost: 80, description: '毛茸茸' },
    // 森林动物
    { id: 'bear', name: '小熊', emoji: '🐻', cost: 95, description: '憨态可掬' },
    { id: 'panda', name: '小熊猫', emoji: '🐼', cost: 120, description: '黑白分明' },
    { id: 'koala', name: '小考拉', emoji: '🐨', cost: 110, description: '抱树睡觉' },
    { id: 'fox', name: '小狐狸', emoji: '🦊', cost: 95, description: '聪明伶俐' },
    { id: 'wolf', name: '小狼', emoji: '🐺', cost: 100, description: '勇敢威武' },
    { id: 'deer', name: '小鹿', emoji: '🦌', cost: 95, description: '优雅美丽' },
    { id: 'elk', name: '大角鹿', emoji: '🦌', cost: 100, description: '鹿角威武' },
    { id: 'moose', name: '驼鹿', emoji: '🫎', cost: 110, description: '高大威猛' },
    { id: 'squirrel', name: '小松鼠', emoji: '🐿', cost: 75, description: '储藏坚果' },
    { id: 'raccoon', name: '小浣熊', emoji: '🦝', cost: 90, description: '爱洗东西' },
    { id: 'skunk', name: '臭鼬', emoji: '🦨', cost: 70, description: '黑白条纹' },
    // 海洋动物
    { id: 'whale', name: '大鲸鱼', emoji: '🐋', cost: 100, description: '海中巨兽' },
    { id: 'dolphin', name: '海豚', emoji: '🐬', cost: 95, description: '聪明友好' },
    { id: 'fish', name: '小金鱼', emoji: '🐠', cost: 50, description: '游来游去' },
    { id: 'fish2', name: '热带鱼', emoji: '🐟', cost: 55, description: '五彩斑斓' },
    { id: 'fish3', name: '河豚', emoji: '🐡', cost: 60, description: '圆圆的气球鱼' },
    { id: 'crab2', name: '小螃蟹', emoji: '🦀', cost: 55, description: '横行霸道' },
    { id: 'lobster', name: '龙虾', emoji: '🦞', cost: 80, description: '红色的大钳子' },
    { id: 'shrimp2', name: '小虾', emoji: '🦐', cost: 45, description: '小小虾米' },
    { id: 'squid', name: '鱿鱼', emoji: '🦑', cost: 50, description: '长长的触须' },
    { id: 'shell', name: '海螺', emoji: '🐚', cost: 40, description: '大海的礼物' },
    { id: 'turtle', name: '小海龟', emoji: '🐢', cost: 65, description: '长寿代表' },
    { id: 'seal', name: '小海豹', emoji: '🦭', cost: 90, description: '圆滚滚' },
    { id: 'otter', name: '水獭', emoji: '🦦', cost: 85, description: '爱玩石头' },
    { id: 'penguin', name: '小企鹅', emoji: '🐧', cost: 100, description: '摇摇摆摆' },
    // 鸟类
    { id: 'bird', name: '小鸟', emoji: '🐦', cost: 45, description: '会飞翔' },
    { id: 'hatching', name: '小鸡', emoji: '🐣', cost: 50, description: '刚出生' },
    { id: 'chick', name: '小鸡仔', emoji: '🐤', cost: 45, description: '叽叽叽' },
    { id: 'duck', name: '小鸭子', emoji: '🦆', cost: 55, description: '嘎嘎嘎' },
    { id: 'swan', name: '白天鹅', emoji: '🦢', cost: 100, description: '优雅高贵' },
    { id: 'eagle', name: '小鹰', emoji: '🦅', cost: 95, description: '翱翔天空' },
    { id: 'owl', name: '小猫头鹰', emoji: '🦉', cost: 90, description: '聪明睿智' },
    { id: 'parrot', name: '鹦鹉', emoji: '🦜', cost: 85, description: '会说话' },
    { id: 'flamingo', name: '火烈鸟', emoji: '🦩', cost: 95, description: '粉红美丽' },
    { id: 'peacock', name: '孔雀', emoji: '🦚', cost: 110, description: '华丽开屏' },
    { id: 'turkey', name: '火鸡', emoji: '🦃', cost: 70, description: '感恩节' },
    { id: 'dove', name: '鸽子', emoji: '🕊️', cost: 50, description: '和平使者' },
    // 昆虫类
    { id: 'butterfly', name: '小蝴蝶', emoji: '🦋', cost: 55, description: '翩翩起舞' },
    { id: 'ladybug', name: '小瓢虫', emoji: '🐞', cost: 45, description: '红红的壳' },
    { id: 'bee', name: '小蜜蜂', emoji: '🐝', cost: 50, description: '勤劳采蜜' },
    { id: 'beetle', name: '甲虫', emoji: '🪲', cost: 45, description: '亮晶晶' },
    { id: 'ant', name: '小蚂蚁', emoji: '🐜', cost: 30, description: '团结力量大' },
    { id: 'snail', name: '小蜗牛', emoji: '🐌', cost: 40, description: '慢慢爬' },
    { id: 'bug', name: '小虫子', emoji: '🐛', cost: 35, description: '绿色蠕动' },
    // 农场动物
    { id: 'cow', name: '小奶牛', emoji: '🐮', cost: 80, description: '黑白花纹' },
    { id: 'ox', name: '小牛', emoji: '🐂', cost: 85, description: '勤勤恳恳' },
    { id: 'water-buffalo', name: '水牛', emoji: '🐃', cost: 90, description: '力气大' },
    { id: 'pig', name: '小猪猪', emoji: '🐷', cost: 70, description: '粉粉可爱' },
    { id: 'boar', name: '野猪', emoji: '🐗', cost: 80, description: '凶猛勇敢' },
    { id: 'horse', name: '小马驹', emoji: '🐴', cost: 90, description: '奔跑如风' },
    { id: 'donkey', name: '小驴', emoji: '🫏', cost: 75, description: '可爱倔强' },
    { id: 'goat', name: '小山羊', emoji: '🐐', cost: 70, description: '爱跳跳' },
    { id: 'sheep', name: '小绵羊', emoji: '🐑', cost: 85, description: '白白软软' },
    { id: 'ram', name: '大绵羊', emoji: '🐏', cost: 85, description: '卷卷毛' },
    // 丛林动物
    { id: 'lion', name: '小狮子', emoji: '🦁', cost: 110, description: '森林之王' },
    { id: 'tiger', name: '小老虎', emoji: '🐯', cost: 115, description: '威风凛凛' },
    { id: 'leopard', name: '小豹子', emoji: '🐆', cost: 105, description: '花纹美丽' },
    { id: 'elephant', name: '小象', emoji: '🐘', cost: 105, description: '长鼻子' },
    { id: 'rhinoceros', name: '小犀牛', emoji: '🦏', cost: 100, description: '坚硬的角' },
    { id: 'hippo', name: '小河马', emoji: '🦛', cost: 95, description: '圆圆的大嘴' },
    { id: 'giraffe', name: '小长颈鹿', emoji: '🦒', cost: 100, description: '脖子长长' },
    { id: 'zebra', name: '小斑马', emoji: '🦓', cost: 95, description: '黑白条纹' },
    { id: 'gorilla', name: '大猩猩', emoji: '🦍', cost: 100, description: '力量强大' },
    { id: 'monkey', name: '小猴子', emoji: '🐵', cost: 85, description: '活泼好动' },
    { id: 'orangutan', name: '红毛猩猩', emoji: '🦧', cost: 105, description: '毛茸茸' },
    { id: 'hedgehog', name: '小刺猬', emoji: '🦔', cost: 75, description: '满身刺刺' },
    { id: 'bat', name: '小蝙蝠', emoji: '🦇', cost: 60, description: '黑夜飞行' },
    // 两栖动物
    { id: 'frog', name: '小青蛙', emoji: '🐸', cost: 70, description: '呱呱呱' },
    { id: 'turtle2', name: '小乌龟', emoji: '🐢', cost: 65, description: '慢慢爬' },
    { id: 'crocodile', name: '小鳄鱼', emoji: '🐊', cost: 90, description: '凶猛潜伏' },
    { id: 'lizard', name: '小蜥蜴', emoji: '🦎', cost: 55, description: '皮肤光滑' },
    { id: 'snake', name: '小蛇', emoji: '🐍', cost: 60, description: '长长的身体' },
    // 恐龙（可爱版）
    { id: 'rex', name: '小霸王龙', emoji: '🦖', cost: 150, description: '萌萌的恐龙' },
    { id: 'pterodactyl', name: '小翼龙', emoji: '🦕', cost: 140, description: '会飞的恐龙' },
  ],
  accessories: [
    { id: 'crown', name: '小皇冠', emoji: '👑', cost: 150, description: '国王的象征' },
    { id: 'hat', name: '小帽子', emoji: '🎩', cost: 80, description: '帅气的帽子' },
    { id: 'glasses', name: '眼镜', emoji: '👓', cost: 60, description: '酷酷的眼镜' },
    { id: 'scarf', name: '围巾', emoji: '🧣', cost: 70, description: '暖暖的围巾' },
    { id: 'bow', name: '蝴蝶结', emoji: '🎀', cost: 50, description: '漂亮的蝴蝶结' },
    { id: 'bell', name: '小铃铛', emoji: '🔔', cost: 45, description: '叮叮当当' },
    { id: 'flower', name: '小花朵', emoji: '🌸', cost: 55, description: '美丽的花' },
    { id: 'balloon', name: '气球', emoji: '🎈', cost: 40, description: '飘啊飘' },
    { id: 'ribbon', name: '丝带', emoji: '🎗️', cost: 35, description: '飘逸丝带' },
    { id: 'star-item', name: '星星', emoji: '⭐', cost: 100, description: '闪闪发光' },
    { id: 'heart', name: '爱心', emoji: '❤️', cost: 80, description: '满满的爱' },
    { id: 'gem', name: '宝石', emoji: '💎', cost: 200, description: '珍贵的宝石' },
    { id: 'diamond', name: '钻石', emoji: '💠', cost: 300, description: '闪闪钻石' },
    { id: 'coin', name: '金币', emoji: '🪙', cost: 150, description: '闪闪金币' },
  ],
  nature: [
    { id: 'moon', name: '月亮', emoji: '🌙', cost: 120, description: '皎洁月光' },
    { id: 'sun', name: '太阳', emoji: '☀️', cost: 100, description: '阳光灿烂' },
    { id: 'cloud', name: '云朵', emoji: '☁️', cost: 60, description: '软软云朵' },
    { id: 'rainbow', name: '彩虹', emoji: '🌈', cost: 180, description: '七彩桥' },
    { id: 'sunflower', name: '向日葵', emoji: '🌻', cost: 70, description: '向着阳光' },
    { id: 'tulip', name: '郁金香', emoji: '🌷', cost: 65, description: '优雅美丽' },
    { id: 'rose', name: '玫瑰花', emoji: '🌹', cost: 80, description: '爱情之花' },
    { id: 'mushroom', name: '小蘑菇', emoji: '🍄', cost: 50, description: '森林里的伞' },
    { id: 'tree', name: '小树', emoji: '🌲', cost: 90, description: '绿绿的树' },
    { id: 'clover', name: '四叶草', emoji: '🍀', cost: 100, description: '幸运草' },
    { id: 'maple', name: '枫叶', emoji: '🍁', cost: 55, description: '红红的叶' },
    { id: 'acorn', name: '橡果', emoji: '🌰', cost: 45, description: '松鼠的粮食' },
    { id: 'mushroom-red', name: '红蘑菇', emoji: '🍄', cost: 60, description: '童话里的蘑菇' },
    { id: 'shell', name: '贝壳', emoji: '🐚', cost: 50, description: '大海的礼物' },
    { id: 'coral', name: '珊瑚', emoji: '🪸', cost: 85, description: '海底花园' },
    { id: 'palm', name: '棕榈树', emoji: '🌴', cost: 75, description: '热带风情' },
  ],
};

type Category = ShopCategory;

export function ShopPage() {
  const navigate = useNavigate();
  const { userData, spendPoints, getItem, getFoodPreference } = useUserData();
  const [category, setCategory] = useState<Category>('food');
  const [successItem, setSuccessItem] = useState<ShopItem | null>(null);
  const [showOwned, setShowOwned] = useState<string | null>(null);
  const [insufficientMsg, setInsufficientMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'backpack'>('shop');
  const [highlightBackpackTab, setHighlightBackpackTab] = useState(false);

  // 从userData中获取已拥有物品
  const userItems = userData.userItems || {};

  const getPreferenceBadge = (item: ShopItem): { text: string; className: string } | null => {
    if (category !== 'food' || !userData.adoptedPet) return null;
    
    const preference = getFoodPreference(userData.adoptedPet, item.id);
    switch (preference) {
      case 'favorite':
        return { text: '最爱', className: 'bg-red-500 text-white' };
      case 'good':
        return { text: '喜欢', className: 'bg-green-500 text-white' };
      case 'bad':
        return { text: '有害', className: 'bg-gray-600 text-white' };
      default:
        return null;
    }
  };

  const categories = [
    { key: 'food' as Category, label: '美味食物', emoji: '🍕', color: 'from-orange-400 to-red-400' },
    { key: 'animals' as Category, label: '小动物', emoji: '🐱', color: 'from-pink-400 to-purple-400' },
    { key: 'accessories' as Category, label: '装饰配件', emoji: '👑', color: 'from-yellow-400 to-orange-400' },
    { key: 'nature' as Category, label: '自然风景', emoji: '🌸', color: 'from-green-400 to-teal-400' },
  ];

  const handlePurchase = (item: ShopItem) => {
    if (userData.points < item.cost) {
      setInsufficientMsg(`积分不足，还需要 ${item.cost - userData.points} 积分才能兑换「${item.name}」`);
      setTimeout(() => setInsufficientMsg(null), 3200);
      return;
    }

    if (userItems[item.id]) {
      setShowOwned(item.name);
      setTimeout(() => setShowOwned(null), 2800);
      return;
    }

    spendPoints(item.cost);
    getItem(item.id);
    setSuccessItem(item);
    setHighlightBackpackTab(true);
    setTimeout(() => setHighlightBackpackTab(false), 2400);
  };

  const closeSuccessModal = () => setSuccessItem(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 pb-8">
      <Header showBack title="兑换商店" />

      {/* 积分展示 */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white text-center mb-6 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <Star className="w-6 h-6 fill-current" />
            <span className="text-2xl font-bold">{userData.points}</span>
            <span className="text-lg">积分</span>
          </div>
          <p className="text-sm mt-1 opacity-90">用积分兑换可爱的小动物和美食吧！</p>
          <p className="text-xs mt-2 px-2 py-1.5 rounded-lg bg-white/20 text-left leading-relaxed">
            兑换后物品会进入上方「我的背包」。领养小动物后，在「小动物养成」页点击背包里的物品即可喂养并获得成长值。
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('shop')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-600 shadow'
            )}
          >
            🏪 兑换商店
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backpack')}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'backpack'
                ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg'
                : 'bg-white text-gray-600 shadow',
              highlightBackpackTab && activeTab !== 'backpack' && 'ring-4 ring-amber-300 ring-offset-2 scale-[1.02]'
            )}
          >
            <Package className="w-5 h-5" />
            我的背包
            {Object.keys(userItems).length > 0 && (
              <span className="bg-white text-orange-500 text-xs px-2 py-0.5 rounded-full font-bold">
                {Object.keys(userItems).length}
              </span>
            )}
          </button>
        </div>

        {/* 背包内容 */}
        {activeTab === 'backpack' && (
          <div className="mb-6">
            {Object.keys(userItems).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-warm">
                <div className="text-6xl mb-4">🎒</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">背包空空~</h3>
                <p className="text-gray-500 mb-4">去商店兑换一些小零食吧！</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-all"
                >
                  去商店 🏪
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 shadow-warm">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  已拥有的物品
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  在这里清点物品；要喂养宠物请打开「小动物养成」页面，在「我的背包」里点击物品即可消耗并增加成长值。
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {Object.entries(userItems).map(([itemId, count]) => {
                    let item: ShopItem | undefined;
                    for (const cat of Object.values(SHOP_ITEMS)) {
                      item = cat.find((i) => i.id === itemId);
                      if (item) break;
                    }
                    const label = item?.name ?? '物品';
                    const emoji = item?.emoji ?? '🎁';
                    return (
                      <div
                        key={itemId}
                        className="bg-orange-50 rounded-xl p-2 text-center hover:bg-orange-100 transition-all"
                        title={`${label} x${count}`}
                      >
                        <div className="text-3xl mb-1">{emoji}</div>
                        <div className="text-xs font-medium text-gray-600 line-clamp-1">{label}</div>
                        <div className="text-xs text-orange-600">x{count}</div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate('/pet')}
                  className="w-full mt-4 bg-gradient-to-r from-orange-400 to-red-500 text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all"
                >
                  🐾 去喂养小动物
                </button>
              </div>
            )}
          </div>
        )}

        {/* 分类标签 */}
        <div className={cn(activeTab === 'backpack' && 'hidden') + ' flex gap-2 mb-6 overflow-x-auto pb-2'}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all',
                category === cat.key
                  ? 'bg-gradient-to-r ' + cat.color + ' text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 shadow'
              )}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 商品网格 */}
        <div className={cn(activeTab === 'backpack' && 'hidden') + ' grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'}>
          {SHOP_ITEMS[category].map((item) => {
            const owned = userItems[item.id];
            const canAfford = userData.points >= item.cost;
            const preferenceBadge = getPreferenceBadge(item);

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePurchase(item);
                  }
                }}
                className={cn(
                  'relative bg-white rounded-2xl p-3 text-center transition-all shadow-warm',
                  owned && 'ring-2 ring-green-400 bg-green-50',
                  !owned && canAfford && 'hover:shadow-warm-lg hover:scale-105 cursor-pointer active:scale-95',
                  !owned && !canAfford && 'opacity-70 cursor-not-allowed',
                  preferenceBadge?.className.includes('gray-600') && !owned && 'opacity-80'
                )}
                onClick={() => handlePurchase(item)}
              >
                {/* 标签 */}
                <div className="absolute -top-1 right-3 flex flex-col gap-1">
                  {owned && (
                    <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      已拥有
                    </div>
                  )}
                  {preferenceBadge && !owned && (
                    <div className={cn(preferenceBadge.className, 'text-xs px-2 py-0.5 rounded-full')}>
                      {preferenceBadge.text}
                    </div>
                  )}
                </div>

                {/* 物品图标 */}
                <div className={cn(
                  'text-4xl mb-2',
                  owned && 'grayscale',
                  preferenceBadge?.className.includes('gray-600') && !owned && 'grayscale opacity-50'
                )}>
                  {item.emoji}
                </div>

                {/* 名称 */}
                <h3 className="font-bold text-sm text-gray-800 mb-1">{item.name}</h3>

                {/* 描述 */}
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.description}</p>

                {/* 价格/状态 */}
                <div className={cn(
                  'rounded-full px-3 py-1 text-sm font-bold',
                  owned
                    ? 'bg-green-100 text-green-600'
                    : canAfford
                      ? preferenceBadge?.className.includes('gray-600')
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                )}>
                  {owned ? '✓ 已拥有' : preferenceBadge?.className.includes('gray-600') ? '⚠️ 有害' : `${item.cost}积分`}
                </div>
              </div>
            );
          })}
        </div>

        {/* 返回按钮 */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/pet')}
            className="flex-1 bg-white rounded-xl p-4 shadow-warm flex items-center justify-center gap-2 hover:shadow-warm-lg transition-all"
          >
            <span className="text-2xl">🐾</span>
            <span className="font-medium text-gray-700">返回小动物养成</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white rounded-xl p-4 shadow-warm flex items-center justify-center gap-2 hover:shadow-warm-lg transition-all"
          >
            <span className="text-2xl">🏠</span>
            <span className="font-medium text-gray-700">返回首页</span>
          </button>
        </div>
      </div>

      {/* 购买成功 */}
      {successItem && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-success-title"
          onClick={(e) => e.target === e.currentTarget && closeSuccessModal()}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl card-pop">
            <div className="text-7xl mb-2">{successItem.emoji}</div>
            <div className="text-4xl mb-3">🎉</div>
            <h3 id="purchase-success-title" className="text-xl font-bold text-gray-800 mb-2">
              兑换成功！
            </h3>
            <p className="text-gray-800 font-medium mb-1">「{successItem.name}」已进入背包</p>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              点下方「查看背包」可立即看到；要到小动物页面喂养，请点击「去喂养小动物」。
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('backpack');
                  closeSuccessModal();
                }}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-warm hover:opacity-95 transition-opacity"
              >
                查看背包
              </button>
              <button
                type="button"
                onClick={() => {
                  closeSuccessModal();
                  navigate('/pet');
                }}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-warm hover:opacity-95 transition-opacity"
              >
                去喂养小动物
              </button>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="w-full py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                留在商店
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 积分不足 */}
      {insufficientMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-[90vw] bg-red-500 text-white px-4 py-3 rounded-2xl shadow-lg text-sm text-center z-50">
          {insufficientMsg}
        </div>
      )}

      {/* 已拥有提示 */}
      {showOwned && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 max-w-[92vw] bg-orange-500 text-white px-4 py-3 rounded-2xl shadow-lg text-center text-sm z-50">
          <p className="font-bold">「{showOwned}」已在背包里</p>
          <p className="text-xs mt-1 opacity-95">点顶部「我的背包」查看，或去小动物页面喂养</p>
        </div>
      )}
    </div>
  );
}
