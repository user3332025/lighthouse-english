import { BookOpen } from 'lucide-react';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';
import { cn } from '@/lib/utils';
import type { TextbookSemesterId } from '@/types';

const SEMESTERS: { id: TextbookSemesterId; title: string; unitLabel: string }[] = [
  { id: 'grade3a', title: GRADE_3A.title, unitLabel: `${GRADE_3A.units.length} 个单元` },
  { id: 'grade3b', title: GRADE_3B.title, unitLabel: `${GRADE_3B.units.length} 个单元` },
];

interface TextbookSemesterPickerProps {
  /** 模块名称，如「句型练习」「对话练习」 */
  moduleTitle: string;
  onSelect: (id: TextbookSemesterId) => void;
}

export function TextbookSemesterPicker({ moduleTitle, onSelect }: TextbookSemesterPickerProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">{moduleTitle}</h2>
      <p className="text-center text-gray-500 text-sm mb-6">请选择与课本对应的学期</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SEMESTERS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'bg-white rounded-2xl p-6 shadow-warm-lg transition-all duration-300',
              'hover:scale-[1.02] hover:shadow-warm-xl active:scale-[0.98]',
              'flex flex-col items-center gap-4 text-left'
            )}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
              <p className="text-sm text-gray-400 mt-2">{s.unitLabel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
