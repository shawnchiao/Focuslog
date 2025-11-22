import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateId, parseTaskInput } from './utils';
import { Task, Subtask } from './types';
import { Button, Badge } from './components/ui';
import { TaskItem } from './components/TaskItem';
import { EyeIcon, EyeOffIcon, ChevronsDownIcon, ChevronsUpIcon, FilterIcon, PlusIcon } from './components/Icons';

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
  const [expandDetails, setExpandDetails] = useState(false);
  const [expandSubtasks, setExpandSubtasks] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
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
    
    const lastSpaceIndex = val.lastIndexOf(' ', cursor - 1);
    const start = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
    
    const before = val.substring(0, start);
    const after = val.substring(cursor);
    
    const spacer = after.startsWith(' ') ? '' : ' ';
    
    const newValue = `${before}#${tag}${spacer}${after}`;
    
    setInputValue(newValue);
    setSuggestedTags([]);
    
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
        e.preventDefault();
        setSuggestedTags([]);
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter === 'active' && task.isCompleted) return false;
      if (statusFilter === 'completed' && !task.isCompleted) return false;

      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(lowerQ);
        if (!matchesTitle) return false;
      }

      if (completionDateFilter) {
        if (!task.completedAt) return false;
        const taskDate = task.completedAt.split('T')[0];
        if (taskDate !== completionDateFilter) return false;
      }

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
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      if (a.isCompleted && b.isCompleted) {
        return (b.completedAt || '').localeCompare(a.completedAt || '');
      }
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

  // Check if any non-default filter is active
  const hasActiveFilters = statusFilter !== 'active' || selectedTags.length > 0 || !!completionDateFilter;

  // --- Render ---
  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-slate-100 overflow-hidden">
      {/* Fixed Navbar Zone - Minimal & Clean */}
      <div className="shrink-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 relative">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
            
            {/* Logo */}
             <h1 className="hidden sm:block text-base font-semibold tracking-tight text-slate-800 cursor-default whitespace-nowrap">
               FocusLog
            </h1>

            {/* Input Group */}
            <form onSubmit={addTask} className="flex-1 flex items-center relative group m-0">
                <div className="w-full h-9 flex items-center bg-slate-100/80 hover:bg-slate-100 rounded-lg px-3 border border-transparent focus-within:bg-white focus-within:border-slate-200 focus-within:shadow-sm transition-all duration-200 relative z-20">
                <input 
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Add task..."
                    className="flex-1 bg-transparent border-none focus:ring-0 placeholder:text-slate-400 text-sm h-full w-full min-w-0"
                    autoFocus
                    autoComplete="off"
                />
                <div className="flex gap-1 items-center">
                    {inputValue.trim() && (
                        <button type="submit" className="text-xs font-medium text-slate-500 hover:text-slate-900 bg-slate-200/50 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors">
                            Enter
                        </button>
                    )}
                </div>
                </div>
                
                {/* Dropdown Recommendations */}
                {suggestedTags.length > 0 && (
                <div className="absolute top-10 left-0 right-0 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {suggestedTags.map((tag, index) => (
                        <div 
                            key={tag}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                insertTag(tag);
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                                index === selectedTagIndex 
                                    ? 'bg-slate-50 text-slate-900' 
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="font-medium">#{tag}</span>
                        </div>
                    ))}
                </div>
                )}
            </form>

             {/* Right Controls - Icon Only Toolbar */}
             <div className="shrink-0 flex items-center justify-end gap-1">
                <Button 
                   variant={showFilters ? 'secondary' : 'ghost'}
                   size="icon" 
                   className={`h-8 w-8 rounded-md transition-all relative ${showFilters ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                   onClick={() => setShowFilters(!showFilters)}
                   title="Toggle Filters"
                >
                   <FilterIcon className="w-4 h-4" />
                   {hasActiveFilters && (
                       <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-900 rounded-full ring-2 ring-white"></span>
                   )}
                </Button>

                <div className="w-px h-4 bg-slate-200 mx-1"></div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandDetails(!expandDetails)}
                    className={`h-8 w-8 rounded-md transition-all ${
                        expandDetails 
                        ? 'text-slate-900 bg-slate-50' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={expandDetails ? "Hide details" : "Show details"}
                >
                    {expandDetails ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandSubtasks(!expandSubtasks)}
                    className={`h-8 w-8 rounded-md transition-all ${
                        expandSubtasks 
                        ? 'text-slate-900 bg-slate-50' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={expandSubtasks ? "Collapse subtasks" : "Expand subtasks"}
                >
                    {expandSubtasks ? <ChevronsUpIcon className="w-4 h-4" /> : <ChevronsDownIcon className="w-4 h-4" />}
                </Button>
             </div>
        </div>

        {/* Collapsible Filter Drawer - Column Layout - Centered */}
        {showFilters && (
            <div className="border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-6 py-3">
                    <div className="flex flex-col gap-3 items-start">
                        
                        <div className="flex items-center gap-2 w-full">
                            {/* Status Filter */}
                            <div className="flex bg-slate-100 p-0.5 rounded-md">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'active', label: 'Active' },
                                    { id: 'completed', label: 'Done' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setStatusFilter(tab.id as any)}
                                        className={`px-3 py-1 text-xs font-medium rounded-[4px] transition-all ${
                                            statusFilter === tab.id 
                                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            <div className="relative flex items-center group">
                                <input 
                                    type="date" 
                                    value={completionDateFilter}
                                    onChange={(e) => setCompletionDateFilter(e.target.value)}
                                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:outline-none focus:border-slate-300 focus:ring-0 shadow-sm h-[26px]"
                                />
                                {completionDateFilter && (
                                <button 
                                    onClick={() => setCompletionDateFilter('')}
                                    className="absolute -right-1.5 -top-1.5 bg-slate-400 text-white rounded-full p-0.5 hover:bg-slate-600 shadow-sm z-10 transition-colors"
                                    title="Clear date"
                                >
                                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                                )}
                            </div>
                            
                            {/* Clear All button when filters are active */}
                            {(selectedTags.length > 0 || completionDateFilter) && (
                                <button 
                                    onClick={() => {
                                        setSelectedTags([]);
                                        setCompletionDateFilter('');
                                    }}
                                    className="ml-auto text-[10px] font-medium text-slate-400 hover:text-slate-900 transition-colors px-2"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {/* Tags Filter */}
                        {allTags.length > 0 && (
                             <div className="flex flex-wrap gap-2 pt-1">
                                {allTags.map(tag => (
                                    <Badge 
                                        key={tag} 
                                        variant="secondary"
                                        onClick={() => toggleTagSelection(tag)}
                                        className={`cursor-pointer transition-all border ${
                                            selectedTags.includes(tag) 
                                                ? 'bg-white text-slate-900 shadow-sm border-slate-200 ring-1 ring-slate-200' 
                                                : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
                                        }`}
                                    >
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Scrollable Content Zone */}
      <main className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
            {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 opacity-40 select-none">
                    <div className="w-10 h-10 border border-slate-300 border-dashed rounded-lg flex items-center justify-center mb-3">
                        <PlusIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                        {hasActiveFilters ? 'No matching tasks' : 'No tasks'}
                    </p>
                </div>
            ) : ((statusFilter === 'completed' || completionDateFilter) && groupedCompletedTasks) ? (
                Object.keys(groupedCompletedTasks).sort((a, b) => b.localeCompare(a)).map(date => (
                    <div key={date} className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1 sticky top-0 bg-white/90 backdrop-blur w-fit pr-4 rounded-r-md z-10 py-2">{date}</h3>
                        <div className="space-y-px">
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
                                    expandDetails={expandDetails}
                                    expandSubtasks={expandSubtasks}
                                />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="space-y-px">
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
                    expandDetails={expandDetails}
                    expandSubtasks={expandSubtasks}
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