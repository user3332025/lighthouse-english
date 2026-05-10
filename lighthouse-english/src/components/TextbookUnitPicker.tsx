import { GRADE_3A, GRADE_3B, type Textbook } from '@/data/wordLearning';
import { cn } from '@/lib/utils';
import type { TextbookSemesterId } from '@/types';

/** 与单词学习 UnitListView 一致：从单元标题取英文主题 */
function getUnitTopicEnglish(title: string): string {
  const unitStyle = title.match(/^Unit\s+\d+\s+(.+)$/i);
  if (unitStyle) return unitStyle[1].trim();
  const paren = title.match(/\(([^)]+)\)/);
  return paren ? paren[1].trim() : '';
}

function bookForSemester(semester: TextbookSemesterId): Textbook {
  return semester === 'grade3a' ? GRADE_3A : GRADE_3B;
}

interface TextbookUnitPickerProps {
  semester: TextbookSemesterId;
  /** 本题库在该册下有哪些单元有题（一般为 1–6） */
  unitNumbers: number[];
  onBack: () => void;
  onSelectUnit: (unit: number) => void;
}

/**
 * 单元导航：布局与单词学习 {@link WordLearningPage} 的 UnitListView 一致（不展示单词数量）。
 */
export function TextbookUnitPicker({
  semester,
  unitNumbers,
  onBack,
  onSelectUnit,
}: TextbookUnitPickerProps) {
  const book = bookForSemester(semester);

  return (
    <div className="max-w-4xl mx-auto px-4 mt-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
        >
          ← 返回
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
          <p className="text-gray-500 text-sm">选择要练习的单元</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {unitNumbers.map((num) => {
          const unitMeta = book.units.find((u) => u.id === num);
          const topic = unitMeta ? getUnitTopicEnglish(unitMeta.title) : '';

          return (
            <button
              key={num}
              type="button"
              onClick={() => onSelectUnit(num)}
              className={cn(
                'bg-white rounded-xl p-4 shadow-warm transition-all duration-300',
                'hover:scale-105 hover:shadow-warm-lg active:scale-95',
                'flex flex-col items-center gap-2'
              )}
            >
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                <span className="text-2xl">{num}</span>
              </div>
              <div className="text-center mt-2">
                <p className="font-bold text-gray-800 text-sm">单元 {num}</p>
                {topic ? <p className="text-xs text-primary-600 mt-1">{topic}</p> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
