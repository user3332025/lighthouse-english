import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { useUserData } from '@/hooks/useUserData';
import { cn, shuffleArray } from '@/lib/utils';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';
import { Star, Search, X, Filter, Volume2, Trash2 } from 'lucide-react';

interface DisplayWord {
  word: string;
  meaning: string;
  phonetic: string;
  image: string;
  textbookId: string;
  textbookTitle: string;
  unitId: number;
  unitTitle: string;
  markedAt: number;
}

function getWordImage(word: string): string {
  const wordImages: Record<string, string> = {
    name: '👤', nice: '😊', ear: '👂', hand: '🤚', eye: '👀', mouth: '👄',
    arm: '💪', can: '🥫', share: '🤝', smile: '😄', listen: '👂',
    help: '🙋', say: '💬', and: '➕', goodbye: '👋', toy: '🧸',
    friend: '👭', good: '👍', mum: '👩', dad: '👨', grandma: '👵',
    grandpa: '👴', mother: '👩', father: '👨', me: '🙋', sister: '👧',
    family: '👨👩👧👦', have: '🤲', big: '🗿', cousin: '👨‍👩‍👧‍👦',
    brother: '👦', baby: '👶', uncle: '👨', aunt: '👩', some: '👀',
    small: '🐜', like: '❤️', dog: '🐕', pet: '🐾', cat: '🐱',
    fish: '🐟', bird: '🐦', rabbit: '🐰', go: '🚶', zoo: '🏛️',
    fox: '🦊', Miss: '👩‍🏫', panda: '🐼', 'red panda': '🐼',
    cute: '🥰', monkey: '🐒', tiger: '🐅', elephant: '🐘',
    lion: '🦁', animal: '🐾', giraffe: '🦒', tall: '🏀',
    fast: '⚡', apple: '🍎', banana: '🍌', farm: '🏡',
    air: '💨', orange: '🍊', grape: '🍇', school: '🏫',
    garden: '🌻', need: '🛒', water: '💧', flower: '🌸',
    grass: '🌿', plant: '🌱', new: '🆕', tree: '🌳',
    sun: '☀️', give: '🎁', us: '👥', them: '👥',
    colour: '🎨', green: '💚', red: '❤️', blue: '💙',
    make: '🔧', purple: '💜', brown: '🤎', bear: '🐻',
    yellow: '💛', duck: '🦆', sea: '🌊', pink: '💗',
    draw: '✏️', white: '⬜', black: '⬛', old: '👵',
    five: '5️⃣', year: '📅', one: '1️⃣', two: '2️⃣',
    three: '3️⃣', four: '4️⃣', ten: '🔟', six: '6️⃣',
    seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', "o'clock": '⏰',
    cut: '✂️', eat: '🍽️', cake: '🎂', where: '📍',
    from: '🚂', about: 'ℹ️', today: '📅', teacher: '👩‍🏫',
    student: '👨‍🎓', after: '⏭️', who: '❓', girl: '👧',
    neighbour: '🏠', boy: '👦', woman: '👩', man: '👨',
    Mr: '👨‍💼', classmate: '👨‍👩‍👧‍👦', he: '👨', also: '➕',
    English: '🇬🇧', she: '👩', very: '✅', UK: '🇬🇧',
    China: '🇨🇳', Canada: '🇨🇦', USA: '🇺🇸', has: '🤲',
    long: '📏', body: '👤', short: '📏', leg: '🦵',
    right: '✅', fat: '🍔', thin: '🦴', slow: '🐢',
    love: '❤️', tail: '🐿️', her: '👩', gift: '🎁',
    picture: '🖼️', card: '🃏', sing: '🎤', dance: '💃',
    talk: '💬', face: '😊', song: '🎶', or: '🔘',
    much: '🤯', find: '🔍', ruler: '📏',
    pen: '✒️', pencil: '✏️', book: '📚', bag: '🎒',
    paper: '📄', these: '👆', see: '👀', smell: '👃',
    taste: '👅', hear: '👂', touch: '🤚', learn: '📖',
    nose: '👃', tongue: '👅', class: '🏫', 'in class': '📚',
    computer: '💻', breakfast: '🍳', time: '⏰', bread: '🍞',
    egg: '🥚', milk: '🥛', noodle: '🍜', juice: '🧃',
    rice: '🍚', meat: '🥩', vegetable: '🥦', healthy: '💪',
    plate: '🍽️', soup: '🥣', fruit: '🍇', colourful: '🌈',
    candy: '🍬', yummy: '😋', at: '📍', boat: '🚤',
    cool: '😎', keep: '🤲', home: '🏠', ball: '⚽',
    doll: '🧸', car: '🚗', on: '🔝', shelf: '📚',
    in: '📦', box: '📦', cap: '🧢', map: '🗺️',
    under: '⬇️', still: '⏳', put: '🤲', fifteen: '1️⃣5️⃣',
    twelve: '1️⃣2️⃣', fourteen: '1️⃣4️⃣', thirteen: '1️⃣3️⃣',
    eleven: '1️⃣1️⃣', twenty: '2️⃣0️⃣', seventeen: '1️⃣7️⃣',
    sixteen: '1️⃣6️⃣', eighteen: '1️⃣8️⃣', nineteen: '1️⃣9️⃣',
    'piggy bank': '🐷', pay: '💳', back: '🔙',
  };
  return wordImages[word.toLowerCase()] || '📚';
}

const ALL_TEXTBOOKS = [GRADE_3A, GRADE_3B];

function buildTextbookUnitMap() {
  const map = new Map<string, Map<number, string>>();
  ALL_TEXTBOOKS.forEach(tb => {
    const unitMap = new Map<number, string>();
    tb.units.forEach(u => {
      unitMap.set(u.id, u.title);
    });
    map.set(tb.id, unitMap);
  });
  return map;
}

const TEXTBOOK_UNIT_MAP = buildTextbookUnitMap();

function getUnitTitle(textbookId: string, unitId: number): string {
  return TEXTBOOK_UNIT_MAP.get(textbookId)?.get(unitId) || `Unit ${unitId}`;
}

function getUnitTopicEnglish(title: string): string {
  const unitStyle = title.match(/^Unit\s+\d+\s+(.+)$/i);
  if (unitStyle) return unitStyle[1].trim();
  const paren = title.match(/\(([^)]+)\)/);
  return paren ? paren[1].trim() : '';
}

export function MarkedWordsPage() {
  const navigate = useNavigate();
  const { userData, removeMarkedWord } = useUserData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTextbook, setFilterTextbook] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'markedAt' | 'alphabetical'>('markedAt');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const markedWords = userData.markedWords;

  const displayWords: DisplayWord[] = useMemo(() => {
    const words: DisplayWord[] = markedWords.map(mw => ({
      word: mw.word,
      meaning: mw.meaning,
      phonetic: mw.phonetic,
      image: getWordImage(mw.word),
      textbookId: mw.textbookId,
      textbookTitle: ALL_TEXTBOOKS.find(tb => tb.id === mw.textbookId)?.title || mw.textbookId,
      unitId: mw.unitId,
      unitTitle: getUnitTitle(mw.textbookId, mw.unitId),
      markedAt: mw.markedAt,
    }));

    let filtered = words;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(w =>
        w.word.toLowerCase().includes(query) ||
        w.meaning.includes(query) ||
        w.phonetic.includes(query)
      );
    }

    if (filterTextbook !== 'all') {
      filtered = filtered.filter(w => w.textbookId === filterTextbook);
      if (filterUnit !== 'all') {
        filtered = filtered.filter(w => w.unitId === filterUnit);
      }
    }

    if (sortBy === 'markedAt') {
      filtered.sort((a, b) => b.markedAt - a.markedAt);
    } else {
      filtered.sort((a, b) => a.word.localeCompare(b.word));
    }

    return filtered;
  }, [markedWords, searchQuery, filterTextbook, filterUnit, sortBy]);

  const availableUnits = useMemo(() => {
    if (filterTextbook === 'all') return [];
    const textbook = ALL_TEXTBOOKS.find(tb => tb.id === filterTextbook);
    return textbook?.units || [];
  }, [filterTextbook]);

  const handleRemoveWord = useCallback((word: string, textbookId: string, unitId: number) => {
    removeMarkedWord(word, textbookId, unitId);
    setSelectedWords(prev => {
      const next = new Set(prev);
      next.delete(`${word}-${textbookId}-${unitId}`);
      return next;
    });
  }, [removeMarkedWord]);

  const handleRemoveSelected = useCallback(() => {
    selectedWords.forEach(key => {
      const parts = key.split('-');
      const unitId = parseInt(parts[parts.length - 1]);
      const textbookId = parts[parts.length - 2];
      const word = parts.slice(0, -2).join('-');
      removeMarkedWord(word, textbookId, unitId);
    });
    setSelectedWords(new Set());
  }, [selectedWords, removeMarkedWord]);

  const handleSelectWord = (word: string, textbookId: string, unitId: number) => {
    const key = `${word}-${textbookId}-${unitId}`;
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedWords.size === displayWords.length) {
      setSelectedWords(new Set());
    } else {
      const keys = displayWords.map(w => `${w.word}-${w.textbookId}-${w.unitId}`);
      setSelectedWords(new Set(keys));
    }
  };

  const handleStartReview = () => {
    navigate('/review?mode=marked');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setFilterTextbook('all');
    setFilterUnit('all');
  };

  const hasActiveFilters = searchQuery || filterTextbook !== 'all' || filterUnit !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="重点词" />

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* 顶部统计和操作区 */}
        <div className="bg-white rounded-2xl shadow-warm-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">我的重点词</h2>
                <p className="text-sm text-gray-500">
                  共 {markedWords.length} 个标记单词
                  {displayWords.length !== markedWords.length && 
                    ` · 显示 ${displayWords.length} 个`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title={viewMode === 'grid' ? '切换列表视图' : '切换网格视图'}
              >
                {viewMode === 'grid' ? '☰' : '⊞'}
              </button>
              {selectedWords.size > 0 && (
                <button
                  onClick={handleRemoveSelected}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中 ({selectedWords.size})
                </button>
              )}
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词、中文意思..."
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:outline-none transition-colors text-gray-800"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 筛选器和排序 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                showFilters || hasActiveFilters
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Filter className="w-4 h-4" />
              筛选
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-white rounded-full"></span>
              )}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">排序:</span>
              <button
                onClick={() => setSortBy(sortBy === 'markedAt' ? 'alphabetical' : 'markedAt')}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {sortBy === 'markedAt' ? '按标记时间' : '按字母顺序'}
              </button>
            </div>
          </div>

          {/* 展开的筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">课本</label>
                  <select
                    value={filterTextbook}
                    onChange={(e) => {
                      setFilterTextbook(e.target.value);
                      setFilterUnit('all');
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">全部课本</option>
                    {ALL_TEXTBOOKS.map(tb => (
                      <option key={tb.id} value={tb.id}>{tb.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单元</label>
                  <select
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    disabled={filterTextbook === 'all'}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-yellow-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">全部单元</option>
                    {availableUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        单元 {unit.id} - {getUnitTopicEnglish(unit.title)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    清除筛选
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 重点词列表 */}
        {displayWords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-warm-lg p-12 text-center">
            <div className="text-8xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {hasActiveFilters ? '没有找到匹配的重点词' : '还没有标记重点词'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters 
                ? '尝试调整搜索条件或筛选器'
                : '在单词学习或复习时点击 ⭐ 标记需要重点记忆的单词'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold"
              >
                清除所有筛选
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayWords.map((word, index) => {
              const wordKey = `${word.word}-${word.textbookId}-${word.unitId}`;
              const isSelected = selectedWords.has(wordKey);
              
              return (
                <div
                  key={wordKey}
                  className={cn(
                    'bg-white rounded-2xl shadow-warm p-5 transition-all duration-300 hover:shadow-warm-lg hover:scale-[1.02] relative group',
                    isSelected && 'ring-2 ring-yellow-400 shadow-lg'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 选择框 */}
                  <button
                    onClick={() => handleSelectWord(word.word, word.textbookId, word.unitId)}
                    className={cn(
                      'absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-yellow-400 border-yellow-400 text-white'
                        : 'border-gray-300 hover:border-yellow-400'
                    )}
                  >
                    {isSelected && '✓'}
                  </button>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleRemoveWord(word.word, word.textbookId, word.unitId)}
                    className="absolute top-3 right-3 p-1.5 bg-gray-100 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"
                    title="取消标记"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* 单词卡片内容 */}
                  <div className="text-center pt-6">
                    <div className="text-5xl mb-3">{word.image}</div>
                    
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{word.word}</h3>
                      <Star className="w-5 h-5 text-yellow-500 fill-current flex-shrink-0" />
                    </div>
                    
                    <p className="text-lg text-gray-600 mb-2">{word.meaning}</p>
                    
                    {word.phonetic && (
                      <p className="text-sm text-gray-400 mb-3">{word.phonetic}</p>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <SpeechButton text={word.word} size="sm" />
                    </div>

                    {/* 来源信息 */}
                    <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                      <p>{word.textbookTitle}</p>
                      <p>单元 {word.unitId} · {getUnitTopicEnglish(word.unitTitle)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {displayWords.map((word, index) => {
              const wordKey = `${word.word}-${word.textbookId}-${word.unitId}`;
              const isSelected = selectedWords.has(wordKey);
              
              return (
                <div
                  key={wordKey}
                  className={cn(
                    'bg-white rounded-xl shadow-warm p-4 transition-all duration-200 hover:shadow-warm-lg flex items-center gap-4 group',
                    isSelected && 'ring-2 ring-yellow-400 bg-yellow-50'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* 选择框 */}
                  <button
                    onClick={() => handleSelectWord(word.word, word.textbookId, word.unitId)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      isSelected
                        ? 'bg-yellow-400 border-yellow-400 text-white'
                        : 'border-gray-300 hover:border-yellow-400'
                    )}
                  >
                    {isSelected && '✓'}
                  </button>

                  {/* 单词图标 */}
                  <div className="text-4xl flex-shrink-0">{word.image}</div>
                  
                  {/* 单词信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{word.word}</h3>
                      <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                      <SpeechButton text={word.word} size="sm" />
                    </div>
                    <p className="text-gray-600">{word.meaning}</p>
                    {word.phonetic && (
                      <p className="text-xs text-gray-400 mt-1">{word.phonetic}</p>
                    )}
                  </div>

                  {/* 来源信息 */}
                  <div className="text-xs text-gray-400 hidden md:block flex-shrink-0">
                    <p>{word.textbookTitle}</p>
                    <p>单元 {word.unitId}</p>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleRemoveWord(word.word, word.textbookId, word.unitId)}
                    className="p-2 bg-gray-100 text-gray-400 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all flex-shrink-0"
                    title="取消标记"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部操作按钮 */}
        {displayWords.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartReview}
              className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Volume2 className="w-5 h-5" />
              开始复习重点词
            </button>
            {selectedWords.size > 0 && (
              <button
                onClick={handleRemoveSelected}
                className="px-6 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                删除选中单词
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}