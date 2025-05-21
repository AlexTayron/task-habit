import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const TodoForm = ({ todo, onSave, onCancel }) => {
  const { showToast } = useAppContext();
  const [title, setTitle] = useState(todo ? todo.title : '');
  const [description, setDescription] = useState(todo ? todo.description : '');
  const [completed, setCompleted] = useState(todo ? todo.completed : false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!title.trim()) {
        showToast("Erro de Validação", "O título do To-Do é obrigatório.", "destructive");
        return;
      }

      const todoData = {
        title: title.trim(),
        description: description.trim(),
        completed: completed,
      };

      console.log('Enviando dados do To-Do:', todoData);
      await onSave(todoData);
    } catch (error) {
      console.error('Erro ao salvar To-Do:', error);
      showToast("Erro", "Não foi possível salvar o To-Do. Tente novamente.", "destructive");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title-todo">Título *</Label>
        <Input 
          id="title-todo" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Ex: Comprar pão" 
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="description-todo">Descrição</Label>
        <Textarea 
          id="description-todo" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Detalhes adicionais..." 
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="completed-todo" checked={completed} onCheckedChange={setCompleted} disabled={isSubmitting} />
        <Label htmlFor="completed-todo">Completo</Label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (todo ? 'Salvar Alterações' : 'Criar To-Do')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TodoForm; 