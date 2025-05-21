import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HabitForm from '@/components/habits/HabitForm';
import HabitSessionForm from '@/components/habits/HabitSessionForm';
import HabitCard from '@/components/habits/HabitCard';

const HabitsPage = () => {
  const { habits, addHabit, updateHabit, deleteHabit, addHabitSession } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [currentHabitForSession, setCurrentHabitForSession] = useState(null);

  const handleSaveHabit = (habitData) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
    } else {
      addHabit(habitData);
    }
    setIsFormOpen(false);
    setEditingHabit(null);
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleDeleteHabit = (habitId) => {
    deleteHabit(habitId);
  };

  const handleOpenAddSession = (habit) => {
    setCurrentHabitForSession(habit);
    setIsSessionFormOpen(true);
  };

  const handleSaveSession = (sessionData) => {
    addHabitSession(sessionData);
    setIsSessionFormOpen(false);
    setCurrentHabitForSession(null);
  };

  const handleCloseHabitForm = () => {
    setIsFormOpen(false); 
    setEditingHabit(null);
  }

  const handleCloseSessionForm = () => {
    setIsSessionFormOpen(false); 
    setCurrentHabitForSession(null);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary text-center sm:text-left">
          Seus Hábitos Poderosos
        </h1>
         <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) handleCloseHabitForm(); else setIsFormOpen(true);}}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold shadow-lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Novo Hábito
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-card/80 backdrop-blur-md border-border/50">
              <DialogHeader className="text-center sm:text-left">
                <DialogTitle className="text-2xl text-primary">{editingHabit ? 'Editar Hábito' : 'Criar Novo Hábito'}</DialogTitle>
                <DialogDescription>
                  {editingHabit 
                    ? 'Edite os detalhes do seu hábito.' 
                    : 'Preencha os campos para criar um novo hábito.'
                  }
                </DialogDescription>
              </DialogHeader>
              <HabitForm 
                habit={editingHabit} 
                onSave={handleSaveHabit} 
                onCancel={handleCloseHabitForm}
              />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {habits.length === 0 && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
          <Card className="max-w-md mx-auto p-6 bg-card/50 glassmorphic-card">
            <CardHeader className="items-center">
              <Repeat size={48} className="text-accent mb-4 animate-spin [animation-duration:3s]" />
              <CardTitle className="text-2xl">Construa Hábitos Incríveis!</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg">
                Clique em "Novo Hábito" para começar a trilhar seu caminho de autodesenvolvimento. 💪
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              onEdit={handleEditHabit} 
              onDelete={handleDeleteHabit}
              onAddSession={handleOpenAddSession}
            />
          ))}
        </div>
      </AnimatePresence>

      {currentHabitForSession && (
        <Dialog open={isSessionFormOpen} onOpenChange={(isOpen) => { if(!isOpen) handleCloseSessionForm(); else setIsSessionFormOpen(true);}}>
          <DialogContent className="sm:max-w-[425px] bg-card/80 backdrop-blur-md border-border/50">
            <DialogHeader className="text-center sm:text-left">
              <DialogTitle className="text-2xl text-primary">Registrar Sessão</DialogTitle>
              <DialogDescription>
                Registre o seu progresso para o hábito "{currentHabitForSession.título}".
              </DialogDescription>
              <CardDescription className="text-muted-foreground">Hábito: {currentHabitForSession.título}</CardDescription>
            </DialogHeader>
            <HabitSessionForm
              habit={currentHabitForSession}
              onSave={handleSaveSession}
              onCancel={handleCloseSessionForm}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HabitsPage;