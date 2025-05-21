import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Zap, BarChartBig, Smile, ListChecks, Repeat, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DashboardPage = () => {
  const { 
    tasks, 
    habits, 
    userName, 
    googleCalendarInitialized, 
    googleCalendarSignedIn, 
    handleGoogleCalendarSignIn,
    handleGoogleCalendarSignOut
  } = useAppContext();

  const completedTasks = tasks.filter(task => task.status === "Concluído").length;
  const totalTasks = tasks.length;
  const tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const overallHabitProgress = habits.reduce((acc, habit) => {
    const progress = habit.meta_total > 0 ? Math.min((habit.progresso_atual / habit.meta_total) * 100, 100) : 0;
    return acc + progress;
  }, 0) / (habits.length || 1);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };
  
  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
            {getGreeting()}, {userName || 'Usuário'}!
          </span> 
          <motion.span initial={{ rotate:0}} animate={{rotate: [0, 15, -10, 15, 0]}} transition={{duration:1.5, repeat: Infinity, repeatDelay: 2}} className="inline-block ml-2">👋</motion.span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">Seu resumo de produtividade e bem-estar de hoje.</p>
      </motion.div>
      {tasks.length === 0 && habits.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-10">
          <Card className="max-w-md mx-auto p-6 sm:p-8 glassmorphic-card">
            <CardHeader className="items-center">
              <Zap size={48} className="text-primary mb-4 animate-bounce" />
              <CardTitle className="text-2xl sm:text-3xl">Bem-vindo(a) ao TaskHabit!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-base sm:text-lg">
                Seu espaço para organizar a vida e cultivar hábitos incríveis. Vamos começar?
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/tasks">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold">
                    <ListChecks className="mr-2 h-5 w-5"/>Criar Tarefa
                  </Button>
                </Link>
                <Link to="/habits">
                  <Button variant="outline" className="w-full sm:w-auto text-accent border-accent hover:bg-accent/10 font-semibold">
                   <Repeat className="mr-2 h-5 w-5"/> Novo Hábito
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}      

      <motion.div 
        className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
      >
       
        <motion.div variants={itemVariants}>
          <Card className="glassmorphic-card hover:shadow-2xl transition-shadow duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-primary">Tarefas Concluídas</CardTitle>
              <ListChecks className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold">{completedTasks} <span className="text-base sm:text-lg text-muted-foreground">de {totalTasks}</span></div>
              <Progress value={tasksProgress} className="mt-2 h-2.5 sm:h-3 bg-primary/20" indicatorClassName="bg-gradient-to-r from-green-400 to-accent" />
              <p className="text-xs text-muted-foreground mt-1">
                {tasksProgress.toFixed(0)}% das suas tarefas estão prontas!
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glassmorphic-card hover:shadow-2xl transition-shadow duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-accent">Progresso dos Hábitos</CardTitle>
              <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold">{overallHabitProgress.toFixed(0)}%</div>
              <Progress value={overallHabitProgress} className="mt-2 h-2.5 sm:h-3 bg-accent/20" indicatorClassName="bg-gradient-to-r from-yellow-400 to-primary" />
              <p className="text-xs text-muted-foreground mt-1">
                Média de progresso em {habits.length} hábito(s) ativos.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        
        <motion.div variants={itemVariants}>
          <Card className="glassmorphic-card hover:shadow-2xl transition-shadow duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-secondary">Sincronização com Google Calendar</CardTitle>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
               {!googleCalendarInitialized && <p className="text-sm text-muted-foreground mt-2">Inicializando integração...</p>}
               {googleCalendarInitialized && !googleCalendarSignedIn && (
                 <Button 
                   onClick={handleGoogleCalendarSignIn} 
                   className="w-full mt-4 bg-gradient-to-r from-blue-500 to-teal-500 hover:opacity-90 transition-opacity text-primary-foreground font-semibold"
                 >
                   Conectar Google Calendar
                 </Button>
               )}
                {googleCalendarInitialized && googleCalendarSignedIn && (
                 <div className="w-full flex flex-col items-center space-y-2 mt-2">
                    <div className="text-sm text-green-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-1"/> Conectado
                    </div>
                    <Button 
                      onClick={handleGoogleCalendarSignOut} 
                      variant="outline"
                      size="sm"
                      className="w-full text-red-500 border-red-500 hover:bg-red-500/10"
                    >
                      Desconectar
                    </Button>
                 </div>
               )}
               <p className="text-xs text-muted-foreground mt-4 text-center">
                Sincronize suas tarefas e hábitos com o Google Calendar.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      
    </motion.div>
  );
};

export default DashboardPage;