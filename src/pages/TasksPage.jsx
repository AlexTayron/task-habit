import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import TaskForm from '@/components/tasks/TaskForm';
import TaskCard from '@/components/tasks/TaskCard';
import { PlusCircle, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';

const TasksPage = () => {
  const { tasks, addTask, updateTask, deleteTask, taskStatusOptions, updateTaskStatusDnD, showToast } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      showToast("Erro", "Não foi possível salvar a tarefa. Tente novamente.", "destructive");
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    const taskId = draggableId;
    const newStatus = destination.droppableId;

    updateTaskStatusDnD(taskId, newStatus, source.index, destination.index);
  };


  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary text-center sm:text-left">
          Seu Painel de Tarefas
        </h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if(!isOpen) setEditingTask(null);}}>
          <DialogTrigger asChild>
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold shadow-lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Nova Tarefa
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] bg-card/80 backdrop-blur-md border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">{editingTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Atualize os detalhes da sua tarefa.' : 'Preencha os campos abaixo para criar uma nova tarefa.'}
              </DialogDescription>
            </DialogHeader>
            <TaskForm 
              task={editingTask} 
              onSave={handleSaveTask} 
              onCancel={() => { setIsFormOpen(false); setEditingTask(null); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 && (
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
          <Card className="max-w-md mx-auto p-6 bg-card/50 glassmorphic-card">
            <CardHeader>
              <ListChecks size={48} className="mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl">Quadro Vazio Por Enquanto!</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg">
                Adicione sua primeira tarefa e comece a organizar seu dia! ✨
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {taskStatusOptions.map((statusKey, index) => (
            <Droppable droppableId={statusKey} key={statusKey}>
              {(provided, snapshot) => (
                <motion.div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={cn(
                    "bg-card/50 glassmorphic-card p-3 sm:p-4 rounded-xl shadow-lg min-h-[200px] flex flex-col",
                    snapshot.isDraggingOver ? "bg-primary/10 ring-2 ring-primary" : ""
                  )}
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent border-b-2 border-primary/30 pb-2">
                    {statusKey} ({getTasksByStatus(statusKey).length})
                  </h2>
                  <div className="flex-grow space-y-3 sm:space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                    <AnimatePresence>
                      {getTasksByStatus(statusKey).map((task, taskIndex) => (
                        <Draggable draggableId={task.id} index={taskIndex} key={task.id}>
                          {(providedDraggable, snapshotDraggable) => (
                            <div
                              ref={providedDraggable.innerRef}
                              {...providedDraggable.draggableProps}
                              
                              className={cn(snapshotDraggable.isDragging ? "shadow-2xl opacity-80" : "")}
                            >
                              <TaskCard 
                                task={task} 
                                onEdit={handleEditTask} 
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                                dragHandleProps={providedDraggable.dragHandleProps}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                </motion.div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TasksPage;