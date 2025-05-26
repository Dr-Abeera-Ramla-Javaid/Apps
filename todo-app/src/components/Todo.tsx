import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaCheck, FaStar, FaFolder, FaFolderOpen, FaEye, FaBookmark } from 'react-icons/fa';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface Collection {
  id: number;
  name: string;
  todos: TodoItem[];
  createdAt: string;
}

const LOCAL_STORAGE_KEYS = {
  ACTIVE_TODOS: 'active_todos',
  COLLECTIONS: 'collections',
  ACTIVE_COLLECTION: 'active_collection'
};

const Todo: React.FC = () => {
  // Main todos state
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const savedTodos = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_TODOS);
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  // Collections state
  const [collections, setCollections] = useState<Collection[]>(() => {
    const savedCollections = localStorage.getItem(LOCAL_STORAGE_KEYS.COLLECTIONS);
    return savedCollections ? JSON.parse(savedCollections) : [];
  });

  const [activeCollection, setActiveCollection] = useState<Collection | null>(() => {
    const savedActiveCollection = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_COLLECTION);
    return savedActiveCollection ? JSON.parse(savedActiveCollection) : null;
  });

  const [input, setInput] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [showCollectionInput, setShowCollectionInput] = useState(false);
  const [previewCollection, setPreviewCollection] = useState<Collection | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingTodos, setEditingTodos] = useState<TodoItem[]>([]);
  const [showNewListPrompt, setShowNewListPrompt] = useState(false);

  // Save todos and collections to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_TODOS, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_COLLECTION, JSON.stringify(activeCollection));
  }, [activeCollection]);

  // Modified save function
  const saveChanges = () => {
    if (!activeCollection) return;

    const updatedCollection = {
      ...activeCollection,
      todos: todos
    };
    setCollections(collections.map(col => 
      col.id === activeCollection.id ? updatedCollection : col
    ));
    setActiveCollection(null);
    setTodos([]);
    setHasChanges(false);
    setShowNewListPrompt(false);
  };

  // Modified edit function
  const loadAndEditCollection = (collection: Collection) => {
    setTodos(collection.todos);
    setEditingTodos(collection.todos);
    setActiveCollection(collection);
    setHasChanges(false);
    setShowNewListPrompt(false);
  };

  // Auto-save function for direct edits
  const autoSaveChanges = (newTodos: TodoItem[]) => {
    if (!activeCollection) return;

    const updatedCollection = {
      ...activeCollection,
      todos: newTodos
    };
    setCollections(collections.map(col => 
      col.id === activeCollection.id ? updatedCollection : col
    ));
    setActiveCollection(updatedCollection);
  };

  // Modified todo functions to include auto-save
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newTodos = editId !== null
      ? todos.map(todo => todo.id === editId ? { ...todo, text: input } : todo)
      : [...todos, { id: Date.now(), text: input, completed: false }];

    setTodos(newTodos);
    if (activeCollection) {
      autoSaveChanges(newTodos);
    }
    setEditId(null);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newTodos);
    if (activeCollection) {
      autoSaveChanges(newTodos);
    }
  };

  const deleteTodo = (id: number) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    if (activeCollection) {
      autoSaveChanges(newTodos);
    }
  };

  const editTodo = (id: number) => {
    const todoToEdit = todos.find(todo => todo.id === id);
    if (todoToEdit) {
      setInput(todoToEdit.text);
      setEditId(id);
    }
  };

  const deleteAllTodos = () => {
    setTodos([]);
    if (activeCollection) {
      const updatedCollection = {
        ...activeCollection,
        todos: []
      };
      setActiveCollection(updatedCollection);
      setCollections(collections.map(col => 
        col.id === activeCollection.id ? updatedCollection : col
      ));
    }
  };

  const completeAllTodos = () => {
    const updatedTodos = todos.map(todo => ({ ...todo, completed: true }));
    setTodos(updatedTodos);
    
    if (activeCollection) {
      const updatedCollection = {
        ...activeCollection,
        todos: updatedTodos
      };
      setActiveCollection(updatedCollection);
      setCollections(collections.map(col => 
        col.id === activeCollection.id ? updatedCollection : col
      ));
    }
  };

  // Collection functions
  const createCollection = () => {
    if (!collectionName.trim()) return;
    
    const newCollection: Collection = {
      id: Date.now(),
      name: collectionName,
      todos: [],
      createdAt: new Date().toLocaleString()
    };

    setCollections([...collections, newCollection]);
    setActiveCollection(newCollection);
    setTodos([]);
    setCollectionName('');
    setShowCollectionInput(false);
  };

  const deleteCollection = (id: number) => {
    setCollections(collections.filter(col => col.id !== id));
    if (activeCollection?.id === id) {
      setActiveCollection(null);
      setTodos([]);
    }
    if (previewCollection?.id === id) {
      setPreviewCollection(null);
    }
  };

  const createNewList = () => {
    setActiveCollection(null);
    setTodos([]);
  };

  const cancelChanges = () => {
    if (!activeCollection) return;
    setTodos(editingTodos);
    setHasChanges(false);
  };

  return (
    <div className="flex gap-7 p-6 relative z-10 min-h-screen">
      {/* Memory Collections Side Panel - Move it to the left */}
      <div className="w-96 h-screen sticky top-0 left-0 overflow-y-auto bg-white/10 backdrop-blur-xl p-6 rounded-r-3xl shadow-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-8">
          <FaBookmark className="text-pink-300 text-2xl" />
          <h2 className="text-2xl font-bold text-white">Your Todo Lists</h2>
        </div>

        <div className="space-y-4">
          {collections.map(collection => (
            <div
              key={collection.id}
              className={`group bg-white/5 rounded-2xl border transition-all duration-300 ${
                activeCollection?.id === collection.id 
                  ? 'border-pink-500/50 shadow-lg shadow-pink-500/20' 
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="p-5 border-b border-black/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FaFolderOpen className="text-yellow-300 text-lg" />
                    <span className="font-medium text-white/90">{collection.name}</span>
                  </div>
                  <span className="text-sm text-white/40 bg-white/5 px-2 py-1 rounded-full">
                    {collection.todos.length} items
                  </span>
                </div>
                <div className="text-sm text-white/30">{collection.createdAt}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-b-2xl flex gap-2">
                <button
                  onClick={() => loadAndEditCollection(collection)}
                  className="flex-1 px-4 py-3 bg-blue-500/20 text-blue-200 rounded-xl hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-500/40"
                >
                  <FaEdit className="mr-1" />
                  Edit List
                </button>
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="px-4 py-3 bg-red-500/20 text-red-200 rounded-xl hover:bg-red-500/30 transition-colors group-hover:bg-red-500/40"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {collections.length === 0 && (
            <div className="text-center py-8 text-white/40">
              No lists yet. Create your first list! ✨
            </div>
          )}
        </div>

        {/* Move the create new list form to the bottom of side panel */}
        <div className="mt-8">
          <button
            onClick={() => setShowCollectionInput(true)}
            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-2xl hover:from-violet-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-2"
          >
            <FaFolder className="text-lg" />
            <span className="text-lg font-medium">Create New List</span>
          </button>
        </div>

        {/* Create New List Modal */}
        {(showCollectionInput || showNewListPrompt) && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 w-96">
              <h3 className="text-xl font-bold text-white mb-4">
                {showNewListPrompt ? 'Create Another List?' : 'Create New List'}
              </h3>
              {showNewListPrompt ? (
                <div className="space-y-4">
                  <p className="text-white/70">Your changes have been saved! Would you like to create a new list?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowNewListPrompt(false);
                        setShowCollectionInput(true);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      Yes, Create New
                    </button>
                    <button
                      onClick={() => setShowNewListPrompt(false)}
                      className="flex-1 px-4 py-3 bg-white/10 text-white/80 rounded-xl hover:bg-white/20 transition-all duration-200"
                    >
                      No, Continue
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Enter list name..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:border-white/40 backdrop-blur-sm placeholder-white/30 text-white mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={createCollection}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      Create List
                    </button>
                    <button
                      onClick={() => setShowCollectionInput(false)}
                      className="flex-1 px-4 py-3 bg-white/10 text-white/80 rounded-xl hover:bg-white/20 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Todo Section */}
      <div className="flex-1 max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {activeCollection ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <FaStar className="text-yellow-300 text-3xl animate-pulse" />
                  <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200">
                      {activeCollection.name}
                    </h1>
                    <p className="text-white/50 mt-1">Created on {activeCollection.createdAt}</p>
                  </div>
                </div>
                {hasChanges && (
                  <div className="text-sm text-yellow-300 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/20">
                    Unsaved Changes
                  </div>
                )}
              </div>

              <form onSubmit={addTodo} className="mb-8">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Add or edit todo..."
                      className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 backdrop-blur-sm placeholder-white/30 text-white"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className={`px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl transform transition-all duration-200 flex items-center gap-2
                        ${input.trim() 
                          ? 'hover:from-pink-600 hover:to-purple-600 hover:scale-105 shadow-lg hover:shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40' 
                          : 'opacity-50 cursor-not-allowed'}`}
                    >
                      {editId !== null ? 'Update Todo' : 'Add Todo'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Todo List */}
              <div className="space-y-3 mb-8">
                {todos.map(todo => (
                  <div
                    key={todo.id}
                    className="group flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                          todo.completed 
                            ? 'bg-green-500 border-green-500 group-hover:bg-green-600 group-hover:border-green-600' 
                            : 'border-white/30 group-hover:border-white/50'
                        }`}
                      >
                        {todo.completed && <FaCheck className="text-white text-sm" />}
                      </button>
                      <span className={`text-lg ${todo.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                        {todo.text}
                      </span>
                    </div>
                    
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => editTodo(todo.id)}
                        className="p-2 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                {todos.length === 0 && (
                  <div className="text-center py-12 text-white/40 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/10">
                    This list is empty! Add your first todo above ✨
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {todos.length >= 2 && (
                <div className="flex gap-3 mb-8">
                  <button
                    onClick={completeAllTodos}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center justify-center"
                  >
                    <FaCheck className="mr-2" />
                    Complete All
                  </button>
                  <button
                    onClick={deleteAllTodos}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl hover:from-rose-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 flex items-center justify-center"
                  >
                    <FaTrash className="mr-2" />
                    Delete All
                  </button>
                </div>
              )}

              {/* Save Changes Button - Always visible when there's an active collection */}
              {activeCollection && (
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={saveChanges}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl shadow-green-500/20 hover:shadow-green-500/40 flex items-center justify-center gap-2"
                  >
                    <FaCheck className="text-lg" />
                    <span className="text-lg font-medium">Save Changes</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-3xl font-bold text-white/90 mb-4">Select a List to Edit</h2>
              <p className="text-white/50 text-lg">
                Choose a list from the left sidebar or create a new one to get started ✨
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Todo; 