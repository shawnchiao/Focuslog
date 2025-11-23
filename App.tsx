import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateId, parseTaskInput, toggleInTree, updateInTree, deleteFromTree, addToTree } from './utils';
import { Task, Subtask } from './types';
import { Button, Badge } from './components/ui';
import { TaskItem } from './components/TaskItem';
import { EyeIcon, EyeOffIcon, ChevronsDownIcon, ChevronsUpIcon, FilterIcon, PlusIcon } from './components/Icons';

const STORAGE_KEY = 'focuslog_tasks_v1';

function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Sanitize: ensure all tasks and subtasks have subtasks array
            const sanitize = (items: any[]): any[] => {
                return items.map(item => ({
                    ...item,
                    subtasks: item.subtasks ? sanitize(item.subtasks) : []
                }));
            };
            return sanitize(parsed);
        } catch (e) {
            console.error("Failed to parse tasks", e);
            return [];
        }
    }
    return [];
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
    const collectTags = (items: (Task | Subtask)[]) => {
        items.forEach(item => {
            item.tags.forEach(t => tags.add(t));
            if (item.subtasks) collectTags(item.subtasks);
        });
    };
    collectTags(tasks);
    return Array.from(tags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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

  const handleUpdate = (id: string, updates: Partial<Subtask>) => {
    setTasks(prev => updateInTree(prev, id, updates) as Task[]);
  };

  const handleToggle = (id: string) => {
    setTasks(prev => toggleInTree(prev, id) as Task[]);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this task?')) {
      setTasks(prev => deleteFromTree(prev, id) as Task[]);
    }
  };

  const handleAddSubtask = (parentId: string, title: string, tags: string[]) => {
    const newSubtask: Subtask = {
        id: generateId(),
        parentId,
        title,
        tags,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: []
    };
    setTasks(prev => addToTree(prev, parentId, newSubtask) as Task[]);
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
        // Recursive search for title? Assuming root title match for now or deep?
        // Let's keep it simple: root title match
        const matchesTitle = task.title.toLowerCase().includes(lowerQ);
        if (!matchesTitle) return false;
      }

      if (completionDateFilter) {
        if (!task.completedAt) return false;
        const taskDate = task.completedAt.split('T')[0];
        if (taskDate !== completionDateFilter) return false;
      }

      if (selectedTags.length > 0) {
        const hasTagRecursive = (item: Task | Subtask): boolean => {
            const itemHasTag = selectedTags.some(tag => item.tags.includes(tag));
            if (itemHasTag) return true;
            return !!(item.subtasks && item.subtasks.some(st => hasTagRecursive(st)));
        };
        if (!hasTagRecursive(task)) return false;
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
    <div className="h-screen flex flex-col bg-[var(--focus-bg)] text-[var(--focus-ink)] font-sans overflow-hidden">
      {/* Fixed Navbar Zone - Minimal & Clean */}
      <div className="shrink-0 z-20 glass-panel relative">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-6">
            
            {/* Logo */}
             <h1 className="hidden sm:block text-sm font-semibold tracking-tight text-[var(--focus-ink)] cursor-default whitespace-nowrap opacity-80">
               FocusLog
            </h1>

            {/* Input Group - Spotlight Style */}
            <form onSubmit={addTask} className="flex-1 flex items-center relative group m-0">
                <div className="w-full h-10 flex items-center bg-gray-50 hover:bg-gray-100 rounded-xl px-4 border border-transparent focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-sm transition-all duration-200 relative z-20">
                <input 
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="What needs to be done?"
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-gray-400 text-sm h-full w-full min-w-0"
                    autoFocus
                    autoComplete="off"
                />
                <div className="flex gap-1 items-center">
                    {inputValue.trim() && (
                        <button type="submit" className="text-[10px] uppercase font-bold tracking-wider text-gray-400 hover:text-gray-900 px-2 py-1 rounded transition-colors">
                            Return
                        </button>
                    )}
                </div>
                </div>
                
                {/* Dropdown Recommendations */}
                {suggestedTags.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {suggestedTags.map((tag, index) => (
                        <div 
                            key={tag}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                insertTag(tag);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                                index === selectedTagIndex 
                                    ? 'bg-gray-100 text-gray-900' 
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <span className="font-medium">#{tag}</span>
                            {index === selectedTagIndex && (
                                <span className="text-[10px] font-semibold text-gray-400 tracking-wider opacity-60">TAB</span>
                            )}
                        </div>
                    ))}
                </div>
                )}
            </form>

             {/* Right Controls - Icon Only Toolbar */}
             <div className="shrink-0 flex items-center justify-end gap-2">
                <Button 
                   variant="ghost"
                   size="icon" 
                   className={`h-8 w-8 rounded-lg transition-all relative ${showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                   onClick={() => setShowFilters(!showFilters)}
                   title="Toggle Filters"
                >
                   <FilterIcon className="w-4 h-4" />
                   {hasActiveFilters && (
                       <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full ring-2 ring-white"></span>
                   )}
                </Button>

                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandDetails(!expandDetails)}
                    className={`h-8 w-8 rounded-lg transition-all ${
                        expandDetails 
                        ? 'text-gray-900 bg-gray-50' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={expandDetails ? "Hide details" : "Show details"}
                >
                    {expandDetails ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandSubtasks(!expandSubtasks)}
                    className={`h-8 w-8 rounded-lg transition-all ${
                        expandSubtasks 
                        ? 'text-gray-900 bg-gray-50' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={expandSubtasks ? "Collapse subtasks" : "Expand subtasks"}
                >
                    {expandSubtasks ? <ChevronsUpIcon className="w-4 h-4" /> : <ChevronsDownIcon className="w-4 h-4" />}
                </Button>
             </div>
        </div>

        {/* Collapsible Filter Drawer - Column Layout - Centered */}
        {showFilters && (
            <div className="border-t border-gray-50 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex flex-col gap-4 items-start">
                        
                        <div className="flex items-center gap-3 w-full">
                            {/* Status Filter */}
                            <div className="flex bg-gray-200/50 p-1 rounded-lg">
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
                                                ? 'bg-white text-gray-900 shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-700'
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
                                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-gray-300 focus:ring-0 shadow-sm"
                                />
                                {completionDateFilter && (
                                <button 
                                    onClick={() => setCompletionDateFilter('')}
                                    className="absolute -right-2 -top-2 bg-gray-400 text-white rounded-full p-0.5 hover:bg-gray-600 shadow-sm z-10 transition-colors"
                                    title="Clear date"
                                >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
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
                                    className="ml-auto text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-2"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {/* Tags Filter */}
                        {allTags.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <Badge 
                                        key={tag} 
                                        variant="secondary"
                                        onClick={() => toggleTagSelection(tag)}
                                        className={`cursor-pointer transition-all border ${
                                            selectedTags.includes(tag) 
                                                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
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
        <div className="max-w-3xl mx-auto px-6 py-8 pb-40">
            {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-40 select-none">
                    <div className="w-12 h-12 border border-gray-200 border-dashed rounded-xl flex items-center justify-center mb-4">
                        <PlusIcon className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                        {hasActiveFilters ? 'No tasks match your filters' : 'FocusLog is empty'}
                    </p>
                </div>
            ) : ((statusFilter === 'completed' || completionDateFilter) && groupedCompletedTasks) ? (
                Object.keys(groupedCompletedTasks).sort((a, b) => b.localeCompare(a)).map(date => (
                    <div key={date} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">{date}</h3>
                        <div className="space-y-2">
                            {groupedCompletedTasks[date].map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    onUpdate={handleUpdate}
                                    onAddSubtask={handleAddSubtask}
                                    expandDetails={expandDetails}
                                    expandSubtasks={expandSubtasks}
                                />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="space-y-3">
                {sortedTasks.map(task => (
                    <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    onAddSubtask={handleAddSubtask}
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
