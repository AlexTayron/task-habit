import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Trash2, CheckSquare, AlertTriangle, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, dragHandleProps }) => {
  const { taskStatusOptions } = useAppContext();

  const statusColors = {
    "A Fazer": "border-l-destructive",
    "Em Progresso": "border-l-secondary",
    "Concluído": "border-l-accent",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className={cn("bg-card/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ease-out border-l-4", statusColors[task.status] || "border-l-muted")}>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-grow min-w-0">
              <CardTitle className="text-lg font-semibold text-primary break-words">{task.título}</CardTitle>
              {/*task.sincronizado_google ? (
                <span className="text-xs text-green-400 flex items-center mt-1">
                  <CheckSquare size={14} className="mr-1" /> Sincronizado
                </span>
              ) : (
                 <span className="text-xs text-yellow-400 flex items-center mt-1">
                  <AlertTriangle size={14} className="mr-1" /> Não Sinc.
                </span>
              )*/}
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
               <div {...dragHandleProps} className="cursor-grab p-1 text-muted-foreground hover:text-primary transition-colors">
                <GripVertical size={20} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="text-blue-400 hover:text-blue-300 h-8 w-8">
                <Edit2 size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="text-red-400 hover:text-red-300 h-8 w-8">
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          {task.descrição && <CardDescription className="mt-2 text-sm text-foreground/70 break-words">{task.descrição}</CardDescription>}
        </CardHeader>
        <CardContent className="pb-4 px-4 space-y-2">
          { (task.data_inicial || task.data_final) &&
            <div className="text-xs text-muted-foreground">
              {task.data_inicial && `Início: ${new Date(task.data_inicial).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'2-digit'})} `}
              {task.data_final && `Fim: ${new Date(task.data_final).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'2-digit'})}`}
            </div>
          }
          <Select value={task.status} onValueChange={(newStatus) => onStatusChange(task.id, newStatus)}>
            <SelectTrigger className="w-full h-9 text-xs bg-input/50 border-border/30">
              <SelectValue placeholder="Mover para..." />
            </SelectTrigger>
            <SelectContent>
              {taskStatusOptions.map(opt => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TaskCard;