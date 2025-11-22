import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateId, parseTaskInput } from './utils';
import { Task, Subtask } from './types';
import { Input, Button, Badge } from './components/ui';
import { TaskItem } from './components/TaskItem';
import { PlusIcon, CheckIcon } from './components/Icons';

const STORAGE_KEY = 'focuslog_tasks_v1';

function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [inputValue, setInputValue] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [completionDateFilter, setCompletionDateFilter] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // --- Derived State (Filters & Tags) ---
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(t => {
      t.tags.forEach(tag => tags.add(tag));
      t.subtasks.forEach(st => st.tags.forEach(tag => tags.add(tag)));
    });
    return Array.from(tags).sort();
  }, [tasks]);

  // --- Actions ---
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const { title, tags } = parseTaskInput(inputValue);

    const newTask: Task = {
      id: generateId(),
      title,
      tags,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: []
    };

    setTasks(prev => [newTask, ...prev]);
    setInputValue('');
    setSuggestedTags([]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    ));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const isCompleted = !t.isCompleted;
      return {
        ...t,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString()
      };
    }));
  };

  const deleteTask = (id: string) => {
    if (window.confirm('Delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const addSubtask = (taskId: string, title: string, tags: string[]) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const subtask: Subtask = {
        id: generateId(),
        parentId: taskId,
        title,
        tags,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { ...task, subtasks: [...task.subtasks, subtask] };
    }));
  };

  const updateSubtask = (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const updatedSubtasks = task.subtasks.map(st => {
        if (st.id !== subtaskId) return st;
        return { ...st, ...updates, updatedAt: new Date().toISOString() };
      });
      return { ...task, subtasks: updatedSubtasks };
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const updatedSubtasks = task.subtasks.map(st => {
        if (st.id !== subtaskId) return st;
        const isCompleted = !st.isCompleted;
        return { 
          ...st, 
          isCompleted, 
          completedAt: isCompleted ? new Date().toISOString() : undefined 
        };
      });
      return { ...task, subtasks: updatedSubtasks };
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, subtasks: task.subtasks.filter(st => st.id !== subtaskId) };
    }));
  };

  // --- Input Handling with Autocomplete ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    const cursor = e.target.selectionStart || 0;
    const lastSpaceIndex = val.lastIndexOf(' ', cursor - 1);
    const start = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
    const currentWord = val.substring(start, cursor);

    if (currentWord.startsWith('#') && currentWord.length > 1) {
      const search = currentWord.slice(1).toLowerCase();
      // Filter and Sort: StartsWith matches first, then others.
      const matches = allTags.filter(t => t.toLowerCase().includes(search))
        .sort((a, b) => {
            const aStarts = a.toLowerCase().startsWith(search);
            const bStarts = b.toLowerCase().startsWith(search);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.localeCompare(b);
        });

      if (matches.length > 0) {
         setSuggestedTags(matches.slice(0, 5)); // Limit to top 5
         setSelectedTagIndex(0);
      } else {
         setSuggestedTags([]);
      }
    } else {
      setSuggestedTags([]);
    }
  };

  const insertTag = (tag: string) => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const val = inputValue;
    const cursor = inputEl.selectionStart || 0;
    
    // Find the boundaries of the tag currently being typed
    const lastSpaceIndex = val.lastIndexOf(' ', cursor - 1);
    const start = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
    
    const before = val.substring(0, start);
    const after = val.substring(cursor);
    
    // Add a space after the tag if there isn't one
    const spacer = after.startsWith(' ') ? '' : ' ';
    
    const newValue = `${before}#${tag}${spacer}${after}`;
    
    setInputValue(newValue);
    setSuggestedTags([]);
    
    // Reset focus and move cursor to end of inserted tag
    setTimeout(() => {
      inputEl.focus();
      const newCursorPos = before.length + 1 + tag.length + spacer.length;
      inputEl.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestedTags.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedTagIndex(prev => (prev + 1) % suggestedTags.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedTagIndex(prev => (prev - 1 + suggestedTags.length) % suggestedTags.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertTag(suggestedTags[selectedTagIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault(); // Prevent clearing input if it's just closing menu
        setSuggestedTags([]);
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status Filter
      if (statusFilter === 'active' && task.isCompleted) return false;
      if (statusFilter === 'completed' && !task.isCompleted) return false;

      // Search Filter
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(lowerQ);
        if (!matchesTitle) return false;
      }

      // Completion Date Filter
      if (completionDateFilter) {
        if (!task.completedAt) return false;
        const taskDate = task.completedAt.split('T')[0];
        if (taskDate !== completionDateFilter) return false;
      }

      // Tag Filter
      if (selectedTags.length > 0) {
        const taskTags = new Set([...task.tags, ...task.subtasks.flatMap(s => s.tags)]);
        const hasTag = selectedTags.some(tag => taskTags.has(tag));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, searchQuery, selectedTags, completionDateFilter]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Completed always last
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      
      // If both completed, sort by completion date desc
      if (a.isCompleted && b.isCompleted) {
        return (b.completedAt || '').localeCompare(a.completedAt || '');
      }

      // If both active, sort by creation date desc (newest first)
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [filteredTasks]);

  const groupedCompletedTasks = useMemo(() => {
    if (statusFilter !== 'completed' && !completionDateFilter) return null;
    
    const groups: Record<string, Task[]> = {};
    sortedTasks.forEach(task => {
        if (!task.completedAt) return; 
        const date = task.completedAt.split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
    });
    return groups;
  }, [sortedTasks, statusFilter, completionDateFilter]);

  const toggleTagSelection = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 font-sans selection:bg-slate-100 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="mb-4">
             <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                FocusLog
             </h1>
             <p className="text-sm text-slate-400 mt-0.5">
                {tasks.filter(t => !t.isCompleted).length} active tasks
             </p>
          </div>

          {/* Input Area */}
          <form onSubmit={addTask} className="relative">
            <div className="flex gap-2 items-center bg-slate-50 rounded-xl p-2 border border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all shadow-sm relative z-20">
              <input 
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="What do you need to do? #tag"
                className="flex-1 bg-transparent border-none focus:ring-0 placeholder:text-slate-400 text-sm py-1 px-2"
                autoFocus
                autoComplete="off"
              />
              <Button type="submit" size="sm" className="rounded-lg">Add</Button>
            </div>
            
            {/* Dropdown Recommendations */}
            {suggestedTags.length > 0 && (
              <div className="absolute top-full left-2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                      Suggestions
                  </div>
                  {suggestedTags.map((tag, index) => (
                    <div 
                        key={tag}
                        onMouseDown={(e) => {
                            // Use onMouseDown to prevent input blur before click handles
                            e.preventDefault();
                            insertTag(tag);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                            index === selectedTagIndex 
                                ? 'bg-slate-100 text-slate-900' 
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <span className="font-medium">#{tag}</span>
                        {index === selectedTagIndex && (
                            <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-1 rounded shadow-sm">Tab</span>
                        )}
                    </div>
                  ))}
              </div>
            )}
          </form>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 items-center">
             {/* Tabs */}
             <div className="flex bg-slate-100/80 p-1 rounded-lg">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: 'Active' },
                    { id: 'completed', label: 'Done' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id as any)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            statusFilter === tab.id 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
             </div>

            <div className="h-4 w-px bg-slate-200"></div>

            <div className="relative flex items-center group">
               <span className="text-xs text-slate-400 font-medium mr-2 uppercase tracking-wider">Date</span>
               <input 
                  type="date" 
                  value={completionDateFilter}
                  onChange={(e) => setCompletionDateFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:outline-none focus:border-slate-400 font-medium"
               />
               {completionDateFilter && (
                 <button 
                   onClick={() => setCompletionDateFilter('')}
                   className="absolute -right-2 -top-2 bg-slate-900 text-white rounded-full p-0.5 hover:bg-slate-700 shadow-sm"
                 >
                   <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
               )}
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            {allTags.length > 0 ? (
                allTags.map(tag => (
                    <Badge 
                        key={tag} 
                        variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                        onClick={() => toggleTagSelection(tag)}
                        className="transition-all"
                    >
                        #{tag}
                    </Badge>
                ))
            ) : (
                <span className="text-xs text-slate-300 italic">No tags used yet</span>
            )}
        </div>

        {/* Task List */}
        <div>
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-60">
                <div className="w-12 h-12 border-2 border-slate-200 border-dashed rounded-full flex items-center justify-center mb-3">
                    <PlusIcon className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">No tasks to display.</p>
            </div>
          ) : ((statusFilter === 'completed' || completionDateFilter) && groupedCompletedTasks) ? (
             // Grouped Render for Completed Tasks
             Object.keys(groupedCompletedTasks).sort((a, b) => b.localeCompare(a)).map(date => (
                 <div key={date} className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1 sticky top-32 bg-white/50 backdrop-blur w-fit pr-4 rounded-r-md">{date}</h3>
                     <div className="space-y-1">
                        {groupedCompletedTasks[date].map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onUpdate={updateTask}
                                onAddSubtask={addSubtask}
                                onUpdateSubtask={updateSubtask}
                                onToggleSubtask={toggleSubtask}
                                onDeleteSubtask={deleteSubtask}
                            />
                        ))}
                     </div>
                 </div>
             ))
          ) : (
            // Standard Render for Active/All
            <div className="space-y-1">
              {sortedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onAddSubtask={addSubtask}
                  onUpdateSubtask={updateSubtask}
                  onToggleSubtask={toggleSubtask}
                  onDeleteSubtask={deleteSubtask}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;