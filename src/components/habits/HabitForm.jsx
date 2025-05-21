import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';

const HabitForm = ({ habit, onSave, onCancel }) => {
  const { habitMetaTypeOptions, habitFrequencyOptions, showToast } = useAppContext();
  const [title, setTitle] = useState(habit ? habit.título : '');
  const [description, setDescription] = useState(habit ? habit.descrição : '');
  const [metaType, setMetaType] = useState(habit ? habit.tipo_de_meta : habitMetaTypeOptions[0]);
  const [metaTotal, setMetaTotal] = useState(habit ? String(habit.meta_total) : '');
  const [frequency, setFrequency] = useState(habit ? habit.frequencia : habitFrequencyOptions[0]);
  const [preferredTime, setPreferredTime] = useState(habit ? habit.horario_preferido : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !metaTotal) {
      showToast("Validação Falhou 🙁", "Título e Meta Total são obrigatórios.", "destructive");
      return;
    }
    const metaNum = parseFloat(metaTotal);
    if (isNaN(metaNum) || metaNum <= 0) {
        showToast("Validação Falhou 🙁", "Meta Total deve ser um número positivo.", "destructive");
        return;
    }
    onSave({
      título: title,
      descrição: description,
      tipo_de_meta: metaType,
      meta_total: metaNum,
      frequencia: frequency,
      horario_preferido: preferredTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <Label htmlFor="title-habit" className="text-foreground/80">Título do Hábito</Label>
        <Input id="title-habit" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ler 1 capítulo" className="bg-input/70 border-border/50 focus:bg-input" />
      </div>
      <div>
        <Label htmlFor="description-habit" className="text-foreground/80">Descrição (opcional)</Label>
        <Textarea id="description-habit" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qualquer detalhe extra..." className="bg-input/70 border-border/50 focus:bg-input" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="metaType-habit" className="text-foreground/80">Tipo de Meta</Label>
          <Select value={metaType} onValueChange={setMetaType}>
            <SelectTrigger id="metaType-habit" className="bg-input/70 border-border/50 focus:bg-input"><SelectValue placeholder="Tipo de Meta" /></SelectTrigger>
            <SelectContent>
              {habitMetaTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="metaTotal-habit" className="text-foreground/80">Meta Total</Label>
          <Input id="metaTotal-habit" type="number" value={metaTotal} onChange={(e) => setMetaTotal(e.target.value)} placeholder="Ex: 10" className="bg-input/70 border-border/50 focus:bg-input"/>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency-habit" className="text-foreground/80">Frequência</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency-habit" className="bg-input/70 border-border/50 focus:bg-input"><SelectValue placeholder="Frequência" /></SelectTrigger>
            <SelectContent>
              {habitFrequencyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preferredTime-habit" className="text-foreground/80">Horário (opcional)</Label>
          <Input id="preferredTime-habit" type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="bg-input/70 border-border/50 focus:bg-input"/>
        </div>
      </div>
      <DialogFooter className="pt-4">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button></DialogClose>
        <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold">
          {habit ? 'Salvar Hábito' : 'Criar Hábito'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default HabitForm;