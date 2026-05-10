# 灯塔英语角 🏠

> 村小学生的英语学习乐园

一个温暖的卡通风格英语学习网站，帮助村小学生在趣味中学习英语。

## ✨ 功能特色

### 📚 学习模块
- **单词学习** - 课本同步单词学习，支持录音跟读评分
- **音标学习** - 完整的音标表（元音/辅音），点击查看例词和发音
- **句型练习** - 情景选择题，答对+10分
- **复习模块** - 复习错题本中的题目，答对+5分
- **对话练习** - 情景对话练习，培养口语能力

### 🎮 游戏中心
- **听力选择** - 听发音，选图片
- **拼写匹配** - 三种模式：单词→图片、听音→图片、图片→单词
- **句子排序** - 排列正确句子顺序

### 🎤 录音功能
- 原生 Web API 实现稳定录音
- 支持 WAV 格式，音质无损
- 实时音频波形可视化
- 智能发音相似度评分（0-100分）
- 历史录音记录管理
- 个性化改进建议

### 🐾 小动物养成
- 领养小动物（小狗、小猫、小兔、小熊、小狐狸）
- 用积分喂养小动物让它成长
- 5个等级：幼崽 → 成长 → 成年 → 伙伴 → 守护者

### 💾 数据存储
- 使用 localStorage 本地存储
- 自动保存积分、小动物状态、错题本、录音历史

## 🚀 快速开始

### 安装依赖

```bash
cd lighthouse-english
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动预览服务器

```bash
npm run preview
```

## 📁 项目结构

```
lighthouse-english/
├── lighthouse-english/           # 主项目目录
│   ├── public/
│   │   └── lighthouse.svg        # 网站图标
│   ├── src/
│   │   ├── components/           # React 组件
│   │   │   ├── Header.tsx        # 顶部状态栏
│   │   │   ├── PetModal.tsx      # 小动物弹窗
│   │   │   ├── ProgressBar.tsx   # 进度条组件
│   │   │   ├── SpeechButton.tsx  # 语音播放按钮
│   │   │   ├── FullRecordButton.tsx  # 完整录音按钮
│   │   │   ├── AudioPlayer.tsx   # 音频播放器
│   │   │   └── RecordingHistory.tsx  # 录音历史
│   │   ├── data/
│   │   │   ├── questions.ts      # 题目数据
│   │   │   └── wordLearning.ts   # 单词学习数据
│   │   ├── hooks/
│   │   │   ├── useSpeech.ts      # 语音功能 hook
│   │   │   └── useUserData.ts    # 用户数据管理 hook
│   │   ├── lib/
│   │   │   ├── utils.ts          # 工具函数
│   │   │   ├── AudioRecorder.ts # 录音核心类
│   │   │   └── AudioComparator.ts # 音频对比算法
│   │   ├── pages/                # 页面组件
│   │   │   ├── HomePage.tsx      # 首页
│   │   │   ├── WordLearningPage.tsx # 单词学习
│   │   │   ├── PhoneticPage.tsx  # 音标学习
│   │   │   ├── SentencePage.tsx  # 句型练习
│   │   │   ├── ReviewPage.tsx    # 复习模块
│   │   │   ├── DialoguePage.tsx  # 对话练习
│   │   │   ├── GamesPage.tsx     # 游戏中心
│   │   │   ├── ListeningPage.tsx # 听力选择
│   │   │   ├── MatchingPage.tsx  # 拼写匹配
│   │   │   ├── OrderingPage.tsx  # 句子排序
│   │   │   └── PetPage.tsx       # 小动物养成
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript 类型定义
│   │   ├── App.tsx               # 路由配置
│   │   ├── main.tsx              # 入口文件
│   │   └── index.css             # 全局样式
│   ├── index.html                # HTML 入口
│   ├── package.json              # 项目配置
│   ├── tailwind.config.js        # Tailwind 配置
│   ├── vite.config.ts           # Vite 配置
│   └── tsconfig.json            # TypeScript 配置
├── README.md                     # 项目说明文档
└── .git/                        # Git 仓库
```

## 🎨 设计特点

- **暖色主题** - 橙/黄/米色暖色调，营造温馨学习氛围
- **卡通风格** - 圆角大按钮，清晰圆润的视觉效果
- **响应式设计** - 完美适配手机和电脑
- **动画反馈** - 正确答案/错误动画，小动物鼓励弹窗
- **积分系统** - 答题获得积分，积分喂养小动物

## 📝 语音功能

网站使用 Web Speech API 实现语音朗读功能：
1. 点击右上角的喇叭图标开启语音
2. 各模块的发音按钮即可正常播放

## 🎤 录音功能说明

录音功能支持以下特性：
1. 点击麦克风开始录音
2. 实时显示音频波形和音量状态
3. 点击停止按钮结束录音
4. 系统自动评估发音相似度
5. 查看历史录音记录

**注意**：录音功能需要通过 `http://` 或 `https://` 访问，不能直接打开本地文件。

## 🔧 自定义题目

题目数据位于 `lighthouse-english/src/data/` 目录：
- `questions.ts` - 各类练习题
- `wordLearning.ts` - 单词学习数据

## 📄 License

MIT
