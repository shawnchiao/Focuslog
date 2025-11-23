import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { parseTaskInput } from '../utils';
import { Button, Input } from './ui';
import { CheckIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, FileTextIcon } from './Icons';

interface TaskItemProps {
  task: Task | Subtask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Subtask>) => void;
  onAddSubtask: (parentId: string, title: string, tags: string[]) => void;
  expandDetails: boolean;
  expandSubtasks: boolean;
  level?: number;
}

// Helper for button visual states
const getButtonStyle = (isActive: boolean, hasContent: boolean) => {
    if (isActive) return "bg-gray-100 text-gray-900";
    if (hasContent) return "text-gray-500 hover:text-gray-900 hover:bg-gray-50";
    return "text-gray-300 hover:text-gray-600 hover:bg-gray-50";
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubtask,
  expandDetails,
  expandSubtasks,
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [localDescription, setLocalDescription] = useState(task.description || '');

  useEffect(() => {
    setLocalDescription(task.description || '');
  }, [task.description]);

  useEffect(() => {
      setIsDescriptionOpen(expandDetails);
  }, [expandDetails]);

  useEffect(() => {
      setIsExpanded(expandSubtasks);
  }, [expandSubtasks]);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;

    const { title, tags } = parseTaskInput(subtaskInput);
    onAddSubtask(task.id, title, tags);
    setSubtaskInput('');
    setIsAddingSubtask(false);
    setIsExpanded(true);
  };

  const handleDescriptionBlur = () => {
    if (localDescription !== task.description) {
        onUpdate(task.id, { description: localDescription });
    }
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isRoot = level === 0;

  const handleRowClick = () => {
      if (hasSubtasks) {
          setIsExpanded(!isExpanded);
      } else {
          onToggle(task.id);
      }
  };

  // Styles based on nesting level
  const containerClass = isRoot 
      ? "group flex flex-col py-2 border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/40 px-3 -mx-3 rounded-lg cursor-pointer relative"
      : "flex flex-col relative group/sub pl-9 py-1 cursor-pointer";

  return (
    <div 
      className={containerClass}
      onClick={handleRowClick}
    >
       {/* Tree Lines for Subtasks */}
       {!isRoot && (
           <>
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-100 group-last/sub:bottom-auto group-last/sub:h-4"></div>
            <div className="absolute left-[19px] top-4 w-3 h-px bg-gray-100"></div>
           </>
       )}

      {/* Main Row Content */}
      <div className="flex items-start gap-3 relative z-10">
        <div className={`${isRoot ? 'pt-1' : 'mt-1.5'} relative`}>
           {/* Checkbox */}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            className={`rounded-full border flex items-center justify-center transition-all duration-200 ${
              isRoot ? 'w-5 h-5' : 'w-3.5 h-3.5 rounded' 
            } ${
              task.isCompleted 
                ? 'bg-gray-900 border-gray-900 text-white shadow-sm scale-90' 
                : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
            } ${!isRoot && task.isCompleted ? 'bg-gray-400 border-gray-400' : ''}`}
          >
            {task.isCompleted && <CheckIcon className={isRoot ? "w-3 h-3" : "w-2.5 h-2.5"} />}
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col w-full pt-0.5">
              <span 
                className={`leading-tight break-words transition-colors ${
                    isRoot ? 'text-[15px]' : 'text-sm'
                } ${
                  task.isCompleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900 font-medium'
                }`}
              >
                {task.title}
              </span>
              
              <div className="flex flex-wrap gap-2 mt-1 items-center min-h-[16px]">
                {task.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded-md bg-gray-100/80 border border-gray-200/50 font-medium tracking-wide">
                    #{tag}
                  </span>
                ))}
                {task.description && !isDescriptionOpen && (
                    <FileTextIcon className="w-3 h-3 text-gray-300" />
                )}
                {hasSubtasks && !isExpanded && (
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                        {task.subtasks.length}
                    </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              className={`flex items-center gap-0.5 transition-opacity ${isDescriptionOpen || isAddingSubtask ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover/sub:opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                variant="ghost"
                size="icon" 
                className={`h-7 w-7 rounded transition-all ${getButtonStyle(isDescriptionOpen, !!task.description)}`}
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                title="Description"
              >
                <FileTextIcon className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost"
                size="icon" 
                className={`h-7 w-7 rounded transition-all ${getButtonStyle(isAddingSubtask, false)}`}
                onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                title="Add Subtask"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all"
                onClick={() => onDelete(task.id)}
                title="Delete"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {isDescriptionOpen && (
            <div 
              className="mt-2 mb-3 pl-1 animate-in fade-in slide-in-from-top-1 duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
                 <div className="absolute left-[-10px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full"></div>
                <textarea 
                    className="w-full text-sm text-gray-600 bg-transparent border-none p-0 focus:ring-0 focus:outline-none resize-none min-h-[50px] placeholder:text-gray-300 leading-relaxed"
                    placeholder="Add details, notes, or links..."
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    autoFocus={!task.description}
                />
            </div>
          )}

          {/* Subtasks Section (Recursive) */}
          {(hasSubtasks || isAddingSubtask) && (
             <div 
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
             >
                {hasSubtasks && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group/btn flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors mb-2 select-none ml-[-2px]"
                    >
                        <div className="bg-gray-50 group-hover/btn:bg-gray-100 rounded p-0.5 transition-colors">
                            {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                        </div>
                        {isRoot && <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Subtasks</span>}
                    </button>
                )}

                {(isExpanded || isAddingSubtask) && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 relative">
                        {/* Vertical Line for recursion */}
                        {isExpanded && hasSubtasks && <div className="absolute left-[6px] top-0 bottom-4 w-px bg-gray-100"></div>}

                        {isExpanded && task.subtasks.map(subtask => (
                            <TaskItem 
                                key={subtask.id}
                                task={subtask}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                                onAddSubtask={onAddSubtask}
                                expandDetails={expandDetails}
                                expandSubtasks={expandSubtasks}
                                level={level + 1}
                            />
                        ))}

                        {isAddingSubtask && (
                            <div className="pl-9 py-2 relative">
                                <div className="absolute left-[6px] top-0 h-6 w-px bg-gray-100"></div>
                                <div className="absolute left-[6px] top-6 w-3 h-px bg-gray-100"></div>
                                <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2">
                                    <Input
                                        autoFocus
                                        value={subtaskInput}
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        placeholder="New subtask..."
                                        className="h-7 text-xs border-gray-200 bg-white focus:shadow-sm focus:border-gray-300 transition-all"
                                    />
                                    <Button type="submit" size="sm" className="h-7 text-xs px-2">Add</Button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
