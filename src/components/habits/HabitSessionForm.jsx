import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Zap } from 'lucide-react';

const HabitSessionForm = ({ habit, onSave, onCancel }) => {
  const [quantity, setQuantity] = useState('');
  const { showToast } = useAppContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity) {
      showToast("Validação Falhou 🙁", "Por favor, insira uma quantidade.", "destructive");
      return;
    }
    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      showToast("Validação Falhou 🙁", "Quantidade deve ser um número positivo.", "destructive");
      return;
    }
    onSave({ habitId: habit.id, quantidade: numQuantity });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <Label htmlFor="quantity-session" className="text-foreground/80">Quantidade Realizada ({habit.tipo_de_meta})</Label>
        <Input id="quantity-session" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={`Ex: 5 ${habit.tipo_de_meta}`} className="bg-input/70 border-border/50 focus:bg-input"/>
      </div>
      <DialogFooter className="pt-4">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button></DialogClose>
        <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold">
          <Zap size={16} className="mr-2"/> Registrar
        </Button>
      </DialogFooter>
    </form>
  );
};

export default HabitSessionForm;