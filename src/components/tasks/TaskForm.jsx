import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';

const TaskForm = ({ task, onSave, onCancel }) => {
  const { taskStatusOptions, showToast } = useAppContext();
  const [title, setTitle] = useState(task ? task.título : '');
  const [description, setDescription] = useState(task ? task.descrição : '');
  const [status, setStatus] = useState(task ? task.status : taskStatusOptions[0]);
  const [startDate, setStartDate] = useState(task ? task.data_inicial : '');
  const [endDate, setEndDate] = useState(task ? task.data_final : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validação dos campos obrigatórios
      if (!title.trim()) {
        showToast("Erro de Validação", "O título da tarefa é obrigatório.", "destructive");
        return;
      }

      if (!status) {
        showToast("Erro de Validação", "O status da tarefa é obrigatório.", "destructive");
        return;
      }

      // Preparar dados da tarefa
      const taskData = {
        título: title.trim(),
        descrição: description.trim(),
        status: status,
        data_inicial: startDate || null,
        data_final: endDate || null,
        sincronizado_google: false
      };

      console.log('Enviando dados:', taskData); // Debug
      await onSave(taskData);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      showToast("Erro", "Não foi possível salvar a tarefa. Tente novamente.", "destructive");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title-task">Título *</Label>
        <Input 
          id="title-task" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Ex: Desenvolver landing page" 
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="description-task">Descrição</Label>
        <Textarea 
          id="description-task" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Detalhes da tarefa..." 
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="status-task">Status *</Label>
        <Select 
          value={status} 
          onValueChange={setStatus} 
          required
          disabled={isSubmitting}
        >
          <SelectTrigger id="status-task">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            {taskStatusOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate-task">Data Inicial</Label>
          <Input 
            id="startDate-task" 
            type="datetime-local" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="endDate-task">Data Final</Label>
          <Input 
            id="endDate-task" 
            type="datetime-local" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            disabled={isSubmitting}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (task ? 'Salvar Alterações' : 'Criar Tarefa')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TaskForm;