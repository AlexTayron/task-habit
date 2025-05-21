import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Edit2, Trash2, CheckSquare, AlertTriangle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const HabitCard = ({ habit, onEdit, onDelete, onAddSession }) => {
  const progressPercentage = habit.meta_total > 0 ? Math.min((habit.progresso_atual / habit.meta_total) * 100, 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
      className="h-full"
    >
      <Card className="glassmorphic-card hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary break-words">{habit.título}</CardTitle>
            <div className="flex items-center space-x-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => onEdit(habit)} className="text-blue-400 hover:text-blue-300 h-8 w-8"><Edit2 size={16} /></Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)} className="text-red-400 hover:text-red-300 h-8 w-8"><Trash2 size={16} /></Button>
            </div>
          </div>
          {habit.descrição && <CardDescription className="mt-1 text-xs sm:text-sm text-foreground/70 break-words">{habit.descrição}</CardDescription>}
          {/* {habit.sincronizado_google ? (
            <span className="text-xs text-green-400 flex items-center mt-1">
              <CheckSquare size={14} className="mr-1" /> Sincronizado
            </span>
          ) : (
             <span className="text-xs text-yellow-400 flex items-center mt-1">
              <AlertTriangle size={14} className="mr-1" /> Não Sinc.
            </span>
          )} */}
        </CardHeader>
        <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
          <div>
            <div className="text-sm text-foreground/90">
              Progresso: {habit.progresso_atual} / {habit.meta_total} {habit.tipo_de_meta}
            </div>
            <Progress value={progressPercentage} className="h-3 mt-1 mb-2 bg-primary/20" indicatorClassName="bg-gradient-to-r from-accent to-secondary" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{habit.frequencia}</span>
              {habit.horario_preferido && <span> às {habit.horario_preferido}</span>}
            </div>
          </div>
          <Button onClick={() => onAddSession(habit)} className="w-full mt-3 bg-gradient-to-r from-accent/90 to-secondary/90 hover:opacity-90 text-sm font-semibold shadow-md">
            <Zap size={16} className="mr-2"/> Registrar Sessão
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HabitCard;