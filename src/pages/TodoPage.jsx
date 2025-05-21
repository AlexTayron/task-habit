import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
// import Layout from '@/components/Layout'; // Remover importação de Layout, pois é fornecido pela rota
import { Button } from '@/components/ui/button';
import { PlusCircle, ListChecks } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import TodoForm from '@/components/todos/TodoForm';
import TodoItem from '@/components/todos/TodoItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

const TodoPage = () => {
  const { todos, addTodo, updateTodo, deleteTodo, loading } = useAppContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  const handleSaveTodo = (todoData) => {
    if (editingTodo) {
      updateTodo(editingTodo.id, todoData);
    } else {
      addTodo(todoData);
    }
    setIsFormOpen(false);
    setEditingTodo(null);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const handleDeleteTodo = (todoId) => {
    if (window.confirm("Tem certeza que deseja excluir este To-Do?")) {
      deleteTodo(todoId);
    }
  };

  const handleToggleComplete = (todoId, completed) => {
    updateTodo(todoId, { completed: completed });
  };

  if (loading) {
    return <div>Carregando To-Dos...</div>;
  }

  // Separar e ordenar os To-Dos
  const uncompletedTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed)
    .sort((a, b) => a.title.localeCompare(b.title)); // Ordenar alfabeticamente

  // Concatenar incompletos (em ordem original/reversa) com completos (ordenados)
  const sortedTodos = [...uncompletedTodos, ...completedTodos];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary text-center sm:text-left">
          Seus To-Dos
        </h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if(!isOpen) setEditingTodo(null);}}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold shadow-lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Novo To-Do
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] bg-card/80 backdrop-blur-md border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">{editingTodo ? 'Editar To-Do' : 'Criar Novo To-Do'}</DialogTitle>
              <DialogDescription>
                {editingTodo ? 'Atualize os detalhes do seu To-Do.' : 'Preencha os campos abaixo para criar um novo To-Do.'}
              </DialogDescription>
            </DialogHeader>
            <TodoForm 
              todo={editingTodo} 
              onSave={handleSaveTodo} 
              onCancel={() => { setIsFormOpen(false); setEditingTodo(null); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {todos.length === 0 && (
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
          <Card className="max-w-md mx-auto p-6 sm:p-8 glassmorphic-card">
            <CardHeader>
              <ListChecks size={48} className="mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl sm:text-3xl">Lista Vazia!</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base sm:text-lg">
                Adicione seu primeiro To-Do e comece a riscar itens da sua lista!
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <AnimatePresence>
        <div className="space-y-4">
          {/* Mapear sobre a lista ordenada */}
          {sortedTodos.map(todo => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TodoItem 
                todo={todo} 
                onEdit={handleEditTodo} 
                onDelete={handleDeleteTodo}
                onToggleComplete={handleToggleComplete}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

    </div>
  );
};

export default TodoPage; 