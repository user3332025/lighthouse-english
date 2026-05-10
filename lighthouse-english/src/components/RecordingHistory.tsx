import { useState, useEffect } from 'react';
import { History, Trash2, Clock, Star, Volume2 } from 'lucide-react';
import { Recording } from '../lib/AudioRecorder';
import { AudioPlayer } from './AudioPlayer';

interface RecordingHistoryProps {
  recordings: Recording[];
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
}

export function RecordingHistory({ recordings, onDelete, onClearAll }: RecordingHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const sortedRecordings = [...recordings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (hours < 48) return '昨天';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSimilarityColor = (similarity?: number) => {
    if (!similarity) return 'text-gray-400';
    if (similarity >= 80) return 'text-green-500';
    if (similarity >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSimilarityIcon = (similarity?: number) => {
    if (!similarity) return null;
    if (similarity >= 80) return <Star className="w-3 h-3 fill-yellow-400" />;
    if (similarity >= 60) return <Star className="w-3 h-3 text-yellow-400" />;
    return null;
  };

  if (recordings.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
      >
        <History className="w-4 h-4" />
        <span>历史录音 ({recordings.length})</span>
      </button>

      {showHistory && (
        <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
          {sortedRecordings.map((recording) => (
            <div key={recording.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === recording.id ? null : recording.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    recording.similarity && recording.similarity >= 80
                      ? 'bg-green-100 text-green-600'
                      : recording.similarity && recording.similarity >= 60
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {formatTime(recording.duration)}
                      </span>
                      {getSimilarityIcon(recording.similarity)}
                      {recording.similarity !== undefined && (
                        <span className={`text-xs font-medium ${getSimilarityColor(recording.similarity)}`}>
                          {recording.similarity}分
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(recording.timestamp)}
                    </div>
                  </div>
                </div>

                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(recording.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {expandedId === recording.id && (
                <div className="border-t border-gray-100 p-3">
                  <AudioPlayer
                    recording={recording}
                    onDelete={onDelete}
                    showControls={true}
                  />
                </div>
              )}
            </div>
          ))}

          {onClearAll && recordings.length > 1 && (
            <button
              onClick={onClearAll}
              className="w-full py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              清空所有历史
            </button>
          )}
        </div>
      )}
    </div>
  );
}
