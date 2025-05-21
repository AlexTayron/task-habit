import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Trash2, CheckSquare, Square } from 'lucide-react'; // Adicionar Square icon
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const TodoItem = ({ todo, onEdit, onDelete, onToggleComplete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("flex items-center justify-between p-4 shadow-sm", todo.completed ? "bg-secondary/20" : "bg-card")}>
        <div className="flex items-center space-x-3">
          <Checkbox 
            checked={todo.completed} 
            onCheckedChange={() => onToggleComplete(todo.id, !todo.completed)}
          />
          <div className="grid gap-1.5">
            <p className={cn("text-sm font-medium", todo.completed ? "line-through text-muted-foreground" : "text-foreground")}>
              {todo.title}
            </p>
            {todo.description && (
              <p className={cn("text-xs text-muted-foreground", todo.completed ? "line-through" : "")}>
                {todo.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(todo)} className="h-8 w-8 text-blue-400 hover:text-blue-300">
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} className="h-8 w-8 text-red-400 hover:text-red-300">
            <Trash2 size={16} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default TodoItem; 