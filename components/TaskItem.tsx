import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { parseTaskInput } from '../utils';
import { Button, Input } from './ui';
import { CheckIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, FileTextIcon } from './Icons';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onAddSubtask: (taskId: string, title: string, tags: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  expandDetails: boolean;
  expandSubtasks: boolean;
}

interface SubtaskItemProps {
    taskId: string;
    subtask: Subtask;
    onToggle: (tId: string, sId: string) => void;
    onDelete: (tId: string, sId: string) => void;
    onUpdate: (tId: string, sId: string, updates: Partial<Subtask>) => void;
    expandDetails: boolean;
}

// Helper for button visual states
const getButtonStyle = (isActive: boolean, hasContent: boolean) => {
    if (isActive) return "bg-slate-200 text-slate-900 shadow-sm"; // Open/Active state
    if (hasContent) return "text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900"; // Has content (closed)
    return "text-slate-300 hover:text-slate-600 hover:bg-slate-100"; // Empty (closed)
};

const SubtaskItem: React.FC<SubtaskItemProps> = ({
    taskId,
    subtask,
    onToggle,
    onDelete,
    onUpdate,
    expandDetails
}) => {
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const [localDescription, setLocalDescription] = useState(subtask.description || '');

    useEffect(() => {
        setLocalDescription(subtask.description || '');
    }, [subtask.description]);

    useEffect(() => {
        setIsDescriptionOpen(expandDetails);
    }, [expandDetails]);

    const handleDescriptionBlur = () => {
        if (localDescription !== subtask.description) {
            onUpdate(taskId, subtask.id, { description: localDescription });
        }
    };

    return (
        <div className="flex flex-col relative group/sub pl-6 border-l-2 border-slate-100 ml-2.5 py-1">
            <div className="flex items-start gap-3">
                <button 
                    onClick={() => onToggle(taskId, subtask.id)}
                    className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                    subtask.isCompleted 
                        ? 'bg-slate-400 border-slate-400 text-white' 
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                >
                    {subtask.isCompleted && <CheckIcon className="w-2.5 h-2.5" />}
                </button>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm transition-colors ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {subtask.title}
                                {subtask.tags.map(t => <span key={t} className="ml-2 text-[10px] text-slate-400 font-medium">#{t}</span>)}
                            </span>
                            {/* Mini indicator for description if collapsed */}
                            {subtask.description && !isDescriptionOpen && (
                                <FileTextIcon className="w-3 h-3 text-slate-400 opacity-70" />
                            )}
                        </div>
                        
                        <div className={`flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity ${isDescriptionOpen ? 'opacity-100' : ''}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 rounded transition-all ${getButtonStyle(isDescriptionOpen, !!subtask.description)}`}
                                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                                title={subtask.description ? "Edit Description" : "Add Description"}
                            >
                                <FileTextIcon className="w-3 h-3" />
                            </Button>
                            <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-6 w-6 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 hover:scale-110 transition-all"
                                 onClick={() => onDelete(taskId, subtask.id)}
                                 title="Delete"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                     {isDescriptionOpen && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                            <textarea 
                                className="w-full text-sm text-slate-600 bg-transparent placeholder:text-slate-300 border-none p-0 focus:ring-0 resize-none min-h-[40px]"
                                placeholder="Add notes..."
                                value={localDescription}
                                onChange={(e) => setLocalDescription(e.target.value)}
                                onBlur={handleDescriptionBlur}
                                autoFocus={!subtask.description}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  expandDetails,
  expandSubtasks
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

  const handleAddSubtask = (e: React.FormEvent) => {
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

  const hasSubtasks = task.subtasks.length > 0;

  return (
    <div className="group flex flex-col py-3 border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/50 px-4 -mx-4">
      {/* Main Task Row */}
      <div className="flex items-start gap-4">
        <div className="pt-0.5">
          <button 
            onClick={() => onToggle(task.id)}
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              task.isCompleted 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
          >
            {task.isCompleted && <CheckIcon className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col w-full">
              <span 
                className={`text-base font-medium leading-tight break-words transition-colors ${
                  task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}
              >
                {task.title}
              </span>
              
              <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                {task.tags.map(tag => (
                  <span key={tag} className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium tracking-wide">
                    #{tag}
                  </span>
                ))}
                {/* Mini indicator for description if collapsed */}
                {task.description && !isDescriptionOpen && (
                    <FileTextIcon className="w-3 h-3 text-slate-400 opacity-70" />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex items-center gap-1 transition-opacity ${isDescriptionOpen || isAddingSubtask ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <Button 
                variant="ghost"
                size="icon" 
                className={`h-8 w-8 rounded-md transition-all ${getButtonStyle(isDescriptionOpen, !!task.description)}`}
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                title="Description"
              >
                <FileTextIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost"
                size="icon" 
                className={`h-8 w-8 rounded-md transition-all ${getButtonStyle(isAddingSubtask, false)}`}
                onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                title="Add Subtask"
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 hover:scale-105 transition-all"
                onClick={() => onDelete(task.id)}
                title="Delete Task"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Description Field (Seamless) */}
          {isDescriptionOpen && (
            <div className="mt-3 mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <textarea 
                    className="w-full text-sm text-slate-600 bg-transparent border-none p-0 focus:ring-0 focus:outline-none resize-none min-h-[60px] placeholder:text-slate-300 leading-relaxed"
                    placeholder="Add details, notes, or links..."
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    autoFocus={!task.description}
                />
            </div>
          )}

          {/* Subtasks Section */}
          {(hasSubtasks || isAddingSubtask) && (
             <div className="mt-2">
                {hasSubtasks && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group/btn flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mb-2 select-none"
                    >
                        <div className="bg-slate-100 group-hover/btn:bg-slate-200 rounded p-0.5 transition-colors">
                            {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                        </div>
                        {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} subtasks
                    </button>
                )}

                {(isExpanded || isAddingSubtask) && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {isExpanded && task.subtasks.map(subtask => (
                            <SubtaskItem 
                                key={subtask.id}
                                taskId={task.id}
                                subtask={subtask}
                                onToggle={onToggleSubtask}
                                onDelete={onDeleteSubtask}
                                onUpdate={onUpdateSubtask}
                                expandDetails={expandDetails}
                            />
                        ))}

                        {isAddingSubtask && (
                            <div className="pl-6 border-l-2 border-slate-100 ml-2.5 py-2">
                                <form onSubmit={handleAddSubtask} className="flex gap-2">
                                    <Input
                                        autoFocus
                                        value={subtaskInput}
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        placeholder="New subtask..."
                                        className="h-8 text-sm border-slate-200 bg-slate-50 focus:bg-white focus:shadow-sm transition-all"
                                    />
                                    <Button type="submit" size="sm" className="h-8">Add</Button>
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