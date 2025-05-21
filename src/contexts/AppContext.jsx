import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { auth } from '@/lib/firebase';
import { 
  loginWithEmail, 
  signupWithEmail, 
  loginWithGoogle, 
  logout as firebaseLogout,
  getUserData,
  addTask as firebaseAddTask,
  updateTask as firebaseUpdateTask,
  deleteTask as firebaseDeleteTask,
  addHabit as firebaseAddHabit,
  updateHabit as firebaseUpdateHabit,
  deleteHabit as firebaseDeleteHabit,
  addHabitSession as firebaseAddHabitSession,
  firebaseAddTodo,
  firebaseUpdateTodo,
  firebaseDeleteTodo,
  db,
  saveUserData
} from '@/lib/firebase';

import { 
  initGoogleClient, 
  signInWithGoogle as googleSignIn, // Renomear para evitar conflito com a função de login do firebase
  signOutFromGoogle, // Importar função de signOut
  getIsSignedIn,
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent, 
  fetchCalendarEvents // Importar fetchCalendarEvents
} from '@/lib/googleCalendar'; // Importar funções do Google Calendar

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [boards, setBoards] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitSessions, setHabitSessions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleCalendarInitialized, setGoogleCalendarInitialized] = useState(false); // Estado para inicialização do Google Calendar
  const [googleCalendarSignedIn, setGoogleCalendarSignedIn] = useState(false); // Estado para status de login no Google Calendar

  // Efeito para inicializar o cliente Google Calendar
  useEffect(() => {
    const initialize = async () => {
      try {
        await initGoogleClient();
        setGoogleCalendarInitialized(true);
        // Adicionar listener para mudanças no status de login do Google
        // NOTA: O listener apenas atualiza o estado local googleCalendarSignedIn
        // A lógica de buscar eventos agora está no useEffect de autenticação do Firebase
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Chamar updateSigninStatus uma vez para o estado inicial
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      } catch (error) {
        console.error('Erro ao inicializar cliente Google Calendar:', error);
        showToast("Erro", "Não foi possível inicializar a integração com o Google Calendar.", "destructive");
      }
    };

    // Inicializar apenas se não estiver inicializado
    if (!googleCalendarInitialized) {
      initialize();
    }

     // Cleanup listener
     return () => {
       if (gapi && gapi.auth2 && gapi.auth2.getAuthInstance() && gapi.auth2.getAuthInstance().isSignedIn) {
         try {
            // Remover o listener real adicionando um listener vazio (não há método 'removeListener' simples)
            // Uma abordagem mais robusta seria guardar a referência do listener e removê-la explicitamente.
            // Para este exemplo, um listener vazio ao desmontar ajuda a evitar chamadas inesperadas.
            gapi.auth2.getAuthInstance().isSignedIn.listen(() => {});
         } catch (e) {
           // Ignorar erro se a instância de autenticação não estiver disponível (ex: antes de inicializar completamente)
         }
       }
     };

  }, [googleCalendarInitialized]); // Executar quando googleCalendarInitialized mudar

  // Callback para atualizar o estado de login do Google (AGORA APENAS ATUALIZA O ESTADO LOCAL)
  const updateSigninStatus = useCallback((isSignedIn) => { // Remover async, não busca mais eventos aqui
    setGoogleCalendarSignedIn(isSignedIn);
    if (isSignedIn) {
      console.log('Usuário conectado ao Google Calendar (estado local atualizado).');
      showToast("Conectado!", "Integração com Google Calendar ativa.");
      // A lógica de importação de eventos foi movida para o useEffect de autenticação do Firebase.
    } else {
      console.log('Usuário desconectado do Google Calendar (estado local atualizado).');
      showToast("Desconectado!", "Integração com Google Calendar inativa.");
      // TODO: Se necessário, remover eventos do Calendar do estado local ao deslogar
    }
  }, []); // Dependências: []; não depende mais de user, tasks, habits, todos, fetchCalendarEvents

  // Efeito para carregar dados do usuário E AGORA IMPORTAR EVENTOS DO GOOGLE CALENDAR QUANDO AUTENTICADO
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => { // Adicionar async aqui
      setIsAuthenticated(!!user);
      setUser(user);
      
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) {
          // Garantir que tasks, boards, habits, habitSessions e todos
          // são carregados da subcoleção, mesmo que o documento raiz tenha um array vazio ou desatualizado
          const loadedTasks = userData.tasks || [];
          const loadedHabits = userData.habits || [];
          const loadedTodos = userData.todos || [];

          setTasks(loadedTasks);
          setBoards(userData.boards || []);
          setHabits(loadedHabits);
          setHabitSessions(userData.habitSessions || []);
          setTodos(loadedTodos);
          setUserName(userData.name || null);

          // *** NOVA LÓGICA: Buscar e importar eventos do Google Calendar se conectado ***
          if (googleCalendarInitialized && googleCalendarSignedIn) { // Verificar se Calendar está pronto e conectado
             console.log('Usuário Firebase autenticado e Google Calendar conectado. Buscando eventos do Calendar...');
             // Exemplo: Buscar eventos da próxima semana (ajuste o intervalo conforme necessário)
             const now = new Date();
             const nextWeek = new Date();
             nextWeek.setDate(now.getDate() + 7);

             const { events, error } = await fetchCalendarEvents(now, nextWeek); // user.uid AGORA está disponível se user não for null

             if (error) {
               console.error('Erro ao buscar eventos do Google Calendar após autenticação Firebase:', error);
               showToast("Aviso", "Conectado ao Calendar, mas falhou ao carregar eventos existentes.", "warning");
             } else if (events && events.length > 0) {
                console.log('Eventos do Google Calendar carregados:', events);
                // TODO: Mapear eventos do Calendar para Tarefas/Hábitos/To-Dos e adicioná-los ao estado/Firestore
                // *** Lógica de Mapeamento e Adição (Reutilizada) ***

                const newItemsFromCalendar = events.map(event => {
                   // Exemplo de mapeamento básico para Tarefas
                   // Ajuste isso para lidar com Hábitos e To-Dos também
                   return {
                      título: event.summary,
                      descrição: event.description || '',
                      status: "A Fazer", // Status padrão para itens importados
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      userId: user.uid, // Associe ao usuário logado
                      data_inicial: event.start?.dateTime || event.start?.date ? new Date(event.start?.dateTime || event.start?.date).toISOString() : null,
                      data_final: event.end?.dateTime || event.end?.date ? new Date(event.end?.dateTime || event.end?.date).toISOString() : null,
                      isFromGoogleCalendar: true, // Flag para identificar origem
                      googleCalendarEventId: event.id, // Salvar ID para futura sincronização bidirecional
                   };
                }).filter(item => {
                    // TODO: Lógica mais robusta para verificar se o item já existe no Firestore
                    // Por enquanto, verifica no estado local carregado (loadedTasks, etc.)
                    const exists = loadedTasks.some(task => task.googleCalendarEventId === item.googleCalendarEventId) ||
                                   loadedHabits.some(habit => habit.googleCalendarEventId === item.googleCalendarEventId) ||
                                   loadedTodos.some(todo => todo.googleCalendarEventId === item.googleCalendarEventId);
                    return !exists; // Adicionar apenas se não existir
                });

                console.log('Itens mapeados e filtrados do Calendar:', newItemsFromCalendar);

                // Adicionar os novos itens ao estado local (Tarefas) e potencialmente salvar no Firestore
                if (newItemsFromCalendar.length > 0) {
                   // Adicionar ao estado local das Tarefas (ou Hábitos/To-Dos dependendo do mapeamento)
                   // Usar functional update para garantir que estamos trabalhando com o estado mais recente
                   setTasks(prevTasks => [...prevTasks, ...newItemsFromCalendar]);

                   // TODO: Salvar newItemsFromCalendar no Firestore em lote para eficiência
                   // Percorrer newItemsFromCalendar e chamar firebaseAddTask (ou firebaseAddHabit/firebaseAddTodo) para cada um
                   // Certifique-se de que as funções firebaseAdd... lidam com o googleCalendarEventId já presente.
                    newItemsFromCalendar.forEach(async (item) => {
                       // Exemplo: adicionar como tarefa. Ajuste conforme seu mapeamento.
                       // Precisa garantir que firebaseAddTask use o ID do item retornado do Calendar
                        try {
                           // Nota: firebaseAddTask gera um novo ID. Se quiser usar o ID do evento do Calendar como ID do documento,
                           // precisará ajustar a função firebaseAddTask ou usar setDoc com o ID especificado.
                           // Para simplificar por agora, vamos adicionar como novas tarefas e salvar o googleCalendarEventId nelas.
                            // Passando explicitamente user.uid que AGORA sabemos que não é null
                            const { taskId, error: addError } = await firebaseAddTask(user.uid, item); // Isso criará um novo ID no Firestore
                            if (addError) {
                               console.error('Erro ao salvar item do Calendar no Firestore:', item, addError);
                            }
                        } catch (e) {
                           console.error('Erro inesperado ao salvar item do Calendar no Firestore:', item, e);
                        }
                    });

                   showToast("Sucesso!", `${newItemsFromCalendar.length} eventos do Calendar importados como tarefas.`);
                } else {
                    console.log('Nenhum novo evento do Calendar para importar.');
                }

             } else if (events && events.length === 0) {
                console.log('Nenhum evento encontrado no Google Calendar no período especificado.');
                //showToast("Informação", "Nenhum evento recente encontrado no seu Google Calendar."); // Talvez muito verboso
             }
          } else if (user && !googleCalendarInitialized) {
             console.log('Usuário Firebase autenticado, mas cliente Google Calendar não inicializado.');
          } else if (user && googleCalendarInitialized && !googleCalendarSignedIn) {
             console.log('Usuário Firebase autenticado e cliente Google Calendar inicializado, mas usuário não conectado ao Calendar.');
          }


        } else {
          // Limpar estados se não houver userData (novo usuário ou dados não carregados)
          setTasks([]);
          setBoards([]);
          setHabits([]);
          setHabitSessions([]);
          setTodos([]);
          setUserName(null);
           console.log('Usuário Firebase não autenticado ou sem userData. Estados limpos.');
        }
      } else {
        // Limpar estados ao deslogar do Firebase
        setTasks([]);
        setBoards([]);
        setHabits([]);
        setHabitSessions([]);
        setTodos([]);
        setUserName(null);
         console.log('Usuário Firebase deslogado. Estados limpos.');
        // Opcional: deslogar do cliente Google Calendar também ao deslogar do Firebase
         if (googleCalendarInitialized && googleCalendarSignedIn) {
           try {
              gapi.auth2.getAuthInstance().signOut();
              console.log('Desconectado do Google Calendar ao deslogar do Firebase.');
           } catch (e) {
             console.error('Erro ao deslogar do Google Calendar ao deslogar do Firebase:', e);
           }
         }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [googleCalendarInitialized, googleCalendarSignedIn, fetchCalendarEvents, firebaseAddTask, firebaseUpdateTask, firebaseDeleteTask, firebaseAddHabit, firebaseUpdateHabit, firebaseDeleteHabit, firebaseAddHabitSession, firebaseAddTodo, firebaseUpdateTodo, firebaseDeleteTodo, getUserData]); // Adicionar dependências necessárias, incluindo estados do Google Calendar e funções Firebase

  // Função para iniciar o login no Google Calendar
  const handleGoogleCalendarSignIn = async () => {
    if (!googleCalendarInitialized) {
       showToast("Aviso", "Integração com Google Calendar ainda não inicializada. Tente novamente em instantes.", "warning");
       return;
    }
    try {
      console.log('Tentando login com Google Calendar...');
      const result = await googleSignIn();
      console.log('Resultado do login:', result);
      
      // Verificar se o login foi bem sucedido
      if (result && result.getAuthResponse()) {
        const authResponse = result.getAuthResponse();
        console.log('Auth Response:', {
          access_token: authResponse.access_token ? 'Presente' : 'Ausente',
          id_token: authResponse.id_token ? 'Presente' : 'Ausente',
          scope: authResponse.scope,
          expires_in: authResponse.expires_in,
          first_issued_at: authResponse.first_issued_at,
          expires_at: authResponse.expires_at
        });
      }
    } catch (error) {
      console.error('Erro detalhado ao tentar login com Google Calendar:', error);
      let errorMessage = "Não foi possível conectar ao Google Calendar.";
      
      if (error.error === 'popup_closed_by_user') {
        errorMessage = "A janela de login foi fechada. Por favor, tente novamente.";
      } else if (error.error === 'access_denied') {
        errorMessage = "Acesso negado. Por favor, verifique as permissões necessárias.";
      } else if (error.error === 'immediate_failed') {
        errorMessage = "Falha na autenticação imediata. Por favor, tente novamente.";
      }
      
      showToast("Erro", errorMessage, "destructive");
    }
  };

  // Função para desconectar do Google Calendar
  const handleGoogleCalendarSignOut = async () => {
    if (!googleCalendarInitialized) {
      showToast("Aviso", "Integração com Google Calendar ainda não inicializada.", "warning");
      return;
    }
    if (!googleCalendarSignedIn) {
      showToast("Aviso", "Você não está conectado ao Google Calendar.", "warning");
      return;
    }
    try {
      console.log('Tentando logout do Google Calendar...');
      signOutFromGoogle(); // Usar a função signOutFromGoogle importada
      // O listener updateSigninStatus será chamado automaticamente após o signOut e atualizará googleCalendarSignedIn para false
      showToast("Até logo!", "Desconectado do Google Calendar com sucesso.");
    } catch (error) {
      console.error('Erro ao tentar logout do Google Calendar:', error);
      showToast("Erro", "Não foi possível desconectar do Google Calendar.", "destructive");
    }
  };

  const taskStatusOptions = ["A Fazer", "Em Progresso", "Concluído"];
  const habitMetaTypeOptions = ["capítulos", "páginas", "minutos", "outros", "litros"];
  const habitFrequencyOptions = ["diário", "semanal", "mensal"];

  const showToast = (title, description, variant = "default") => {
    toast({ title, description, variant, duration: 3000 });
  };
  
  // Atualizar addTask com integração Google Calendar
  const addTask = async (taskData) => {
    if (!user) return;
    console.log('Dados recebidos para addTask (AppContext):', taskData); // Debug

    // Validação básica (mais validação está em firebase.js)
    if (!taskData.título || !taskData.status) {
      console.error('Dados inválidos para addTask (AppContext):', taskData); // Debug
      showToast("Erro de Validação", "Título e status são obrigatórios.", "destructive");
      return;
    }

    try {
      // 1. Salvar tarefa no Firestore
      const { taskId, task: newTask, error: firebaseError } = await firebaseAddTask(user.uid, taskData);

      if (firebaseError) {
        console.error('Erro ao chamar firebaseAddTask:', firebaseError); // Debug
        showToast("Erro", `Não foi possível criar a tarefa: ${firebaseError}`, "destructive");
        return;
      }

      console.log('Tarefa adicionada no Firestore (AppContext):', newTask); // Debug

      let googleCalendarEventId = null;
      let googleCalendarError = null;

      // 2. Tentar criar evento no Google Calendar se o cliente estiver conectado
      if (googleCalendarInitialized && googleCalendarSignedIn) {
        console.log('Tentando criar evento no Google Calendar para tarefa:', newTask);
        const { eventId, error: calendarError } = await createCalendarEvent(newTask);

        if (calendarError) {
          console.error('Erro ao criar evento no Google Calendar:', calendarError);
          googleCalendarError = calendarError;
          showToast("Aviso", "Tarefa criada, mas falhou ao sincronizar com o Google Calendar.", "warning");
        } else if (eventId) {
           console.log('Evento criado no Google Calendar com ID:', eventId);
           googleCalendarEventId = eventId;
           // 3. Opcional: Salvar o ID do evento do Google Calendar na tarefa no Firestore
           try {
             await firebaseUpdateTask(user.uid, newTask.id, { googleCalendarEventId: eventId });
             console.log('googleCalendarEventId salvo no Firestore para tarefa:', newTask.id);
             // Atualizar o estado local da tarefa com o eventId
             setTasks(prevTasks =>
               prevTasks.map(task =>
                 task.id === newTask.id ? { ...task, googleCalendarEventId: eventId } : task
               )
             );
           } catch (updateError) {
             console.error('Erro ao salvar googleCalendarEventId no Firestore:', updateError);
             showToast("Aviso", "Tarefa criada e sincronizada com o Calendar, mas falhou ao salvar a referência.", "warning");
           }
        }
      } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
         console.log('Cliente Google Calendar inicializado, mas usuário não conectado. Evento não criado.');
      } else {
         console.log('Cliente Google Calendar não inicializado. Evento não criado.');
      }

      // Atualizar estado local (seja com ou sem sincronização bem-sucedida do calendar)
      // Se o eventId foi salvo no Firestore, o estado já foi atualizado acima. Se não, adiciona a tarefa sem ele.
       if (!googleCalendarEventId) { // Evita duplicar se o eventId já foi salvo e o estado atualizado
         setTasks(prevTasks => [...prevTasks, newTask]);
       }

      if (!googleCalendarError) {
         showToast("Sucesso!", "Tarefa criada." + (googleCalendarEventId ? " Sincronizada com Google Calendar." : ""));
      } else {
         // O aviso de falha na sincronização já foi mostrado acima.
      }

    } catch (error) {
      console.error('Erro inesperado em addTask (AppContext):', error); // Debug
      showToast("Erro", "Ocorreu um erro inesperado ao criar a tarefa.", "destructive");
    }
  };

  // Atualizar updateTask com integração Google Calendar
  const updateTask = async (taskId, updatedData) => {
    if (!user) return;
    console.log('AppContext updateTask: Recebido taskId, updatedData:', { taskId, updatedData }); // Log

    // Encontrar a tarefa no estado local para obter o googleCalendarEventId
    const taskToUpdate = tasks.find(task => task.id === taskId);

    // Tentar atualizar evento no Google Calendar se o cliente estiver conectado e a tarefa tiver um eventId
    if (googleCalendarInitialized && googleCalendarSignedIn && taskToUpdate?.googleCalendarEventId) {
      console.log('Tentando atualizar evento no Google Calendar para tarefa:', taskToUpdate);
      try {
        // Note: updateCalendarEvent precisa dos dados completos do evento. 
        // Você pode precisar mesclar updatedData com os dados existentes da taskToUpdate.
        // A função updateCalendarEvent que você forneceu no googleCalendar.js já espera o objeto de tarefa completo.
        const { error: calendarError } = await updateCalendarEvent(taskToUpdate.googleCalendarEventId, { ...taskToUpdate, ...updatedData });
         if (calendarError) {
           console.error('Erro ao atualizar evento no Google Calendar:', calendarError);
           showToast("Aviso", "Tarefa atualizada, mas falhou ao sincronizar com o Google Calendar.", "warning");
         } else {
            console.log('Evento atualizado no Google Calendar com sucesso.');
         }
      } catch (error) {
         console.error('Erro inesperado ao tentar atualizar evento no Google Calendar:', error);
         showToast("Aviso", "Tarefa atualizada, mas ocorreu um erro inesperado ao sincronizar com o Google Calendar.", "warning");
      }
    } else if (googleCalendarInitialized && googleCalendarSignedIn && !taskToUpdate?.googleCalendarEventId) {
       console.log('Tarefa atualizada, mas sem googleCalendarEventId. Evento do Calendar não atualizado.');
    } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
       console.log('Tarefa atualizada, cliente Google Calendar inicializado, mas usuário não conectado. Evento não atualizado.');
    } else {
       console.log('Tarefa atualizada, cliente Google Calendar não inicializado. Evento não atualizado.');
    }

    // Atualizar tarefa no Firestore
    try {
       const { error: firebaseError } = await firebaseUpdateTask(user.uid, taskId, updatedData);

       if (firebaseError) {
         showToast("Erro ao atualizar tarefa no Firestore", firebaseError, "destructive");
         return;
       }

       // Atualizar estado local
       setTasks(prevTasks => 
         prevTasks.map(task => task.id === taskId ? { ...task, ...updatedData } : task)
       );
       showToast("👍 Atualizado!", "Tarefa atualizada com sucesso no Firestore.");
    } catch (error) {
       console.error('Erro inesperado ao atualizar tarefa no Firestore:', error);
       showToast("Erro", "Não foi possível atualizar a tarefa no Firestore.", "destructive");
    }
  };
  
  const updateTaskStatusDnD = async (taskId, newStatus, sourceIndex, destinationIndex) => {
    if (!user) return;

    console.log('D&D iniciado:', { taskId, newStatus, sourceIndex, destinationIndex }); // Log inicial

    // Otimistic update: Update the UI immediately for a smoother experience
    setTasks(prevTasks => {
      console.log('Estado anterior (prevTasks):', prevTasks); // Log estado anterior

      const newTasks = Array.from(prevTasks);
      const taskIndex = newTasks.findIndex(task => task.id === taskId);
      
      console.log('Índice da tarefa movida no array anterior:', taskIndex); // Log índice encontrado

      if (taskIndex === -1) {
        console.error('Tarefa movida não encontrada no estado local!'); // Erro de log
        return prevTasks; // Should not happen
      }

      const [movedTask] = newTasks.splice(taskIndex, 1);
      console.log('Tarefa removida:', movedTask); // Log tarefa removida
      console.log('Estado após remover:', newTasks); // Log estado após remover
      
      // Update the task's status in the local state object
      movedTask.status = newStatus;
      movedTask.updatedAt = new Date().toISOString(); // Update timestamp

      console.log('Tarefa com status atualizado:', movedTask); // Log tarefa atualizada

      // Find the correct position to insert in the new status column,
      // maintaining the order by creation date (createdAt) within that column.
      const tasksInTargetStatus = newTasks.filter(task => task.status === newStatus);
      let finalInsertIndex = newTasks.length; // Default insert at the end

      // Find insert index based on createdAt within the target status group
      for (let i = 0; i < tasksInTargetStatus.length; i++) {
          if (new Date(movedTask.createdAt) < new Date(tasksInTargetStatus[i].createdAt)) {
              // Find the actual index in the `newTasks` array
              finalInsertIndex = newTasks.indexOf(tasksInTargetStatus[i]);
              if (finalInsertIndex === -1) finalInsertIndex = newTasks.length; // Fallback
              break;
          }
      }
      // If the loop completes without finding a spot, finalInsertIndex remains newTasks.length (insert at end)

      console.log('Índice final de inserção calculado:', finalInsertIndex); // Log índice final

      newTasks.splice(finalInsertIndex, 0, movedTask);
      console.log('Estado após inserir:', newTasks); // Log estado após inserir

      // Re-sort the *entire* list by status option order to ensure columns are correct
      const finalOrderedTasks = taskStatusOptions.flatMap(statusOption =>
        newTasks.filter(task => task.status === statusOption)
      );

      console.log('Estado final ordenado para UI:', finalOrderedTasks); // Log estado final

      return finalOrderedTasks;
    });

    // Persist the status change to Firestore
    // --- Integração com Google Calendar: Atualizar Evento (Status pode afetar o evento?) ---
    // TODO: Considere como a mudança de status deve afetar o evento do Google Calendar.
    // Talvez marcar como completo no Calendar, ou mover para outro calendário?
    // Chame updateCalendarEvent aqui se aplicável, verificando googleCalendarInitialized, googleCalendarSignedIn e task.googleCalendarEventId.
    // -------------------------------------------------------------------------------------
    const { error } = await firebaseUpdateTask(user.uid, taskId, { status: newStatus, updatedAt: new Date().toISOString() });

    if (error) {
      console.error('Erro no Firestore após atualização otimista:', error); // Log erro Firestore
      showToast("Erro ao mover tarefa", error, "destructive");
      // TODO: Handle rollback in UI if Firestore update fails
    } else {
       console.log('Atualização do Firestore bem sucedida.'); // Log sucesso Firestore
       showToast("👍 Atualizado!", "Tarefa movida com sucesso.");
    }
  };

  // Atualizar deleteTask com integração Google Calendar
  const deleteTask = async (taskId) => {
     if (!user) return;
     console.log('AppContext deleteTask: Deletando To-Do com ID:', taskId); // Log

     // Encontrar a tarefa no estado local para obter o googleCalendarEventId
     const taskToDelete = tasks.find(task => task.id === taskId);

     // Tentar excluir evento no Google Calendar se o cliente estiver conectado e a tarefa tiver um eventId
     if (googleCalendarInitialized && googleCalendarSignedIn && taskToDelete?.googleCalendarEventId) {
       console.log('Tentando excluir evento no Google Calendar com ID:', taskToDelete.googleCalendarEventId);
       try {
         const { error: calendarError } = await deleteCalendarEvent(taskToDelete.googleCalendarEventId);
          if (calendarError) {
            console.error('Erro ao excluir evento no Google Calendar:', calendarError);
            // Continuar com a exclusão local e no Firestore mesmo que a exclusão do calendar falhe
            showToast("Aviso", "Tarefa excluída, mas falhou ao remover o evento do Google Calendar.", "warning");
          } else {
             console.log('Evento do Google Calendar excluído com sucesso.');
          }
       } catch (error) {
          console.error('Erro inesperado ao tentar excluir evento do Google Calendar:', error);
          showToast("Aviso", "Tarefa excluída, mas ocorreu um erro inesperado ao sincronizar com o Google Calendar.", "warning");
       }
     } else if (googleCalendarInitialized && googleCalendarSignedIn && !taskToDelete?.googleCalendarEventId) {
        console.log('Tarefa deletada, mas sem googleCalendarEventId. Evento do Calendar não excluído.');
     } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
        console.log('Tarefa deletada, cliente Google Calendar inicializado, mas usuário não conectado. Evento não excluído.');
     } else {
        console.log('Tarefa deletada, cliente Google Calendar não inicializado. Evento não excluído.');
     }

     // Excluir tarefa no Firestore
     try {
        const { error: firebaseError } = await firebaseDeleteTask(user.uid, taskId);

        if (firebaseError) {
          showToast("Erro ao excluir tarefa no Firestore", firebaseError, "destructive");
          return;
        }

        // Atualizar estado local
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        showToast("🗑️ Removido!", "Tarefa excluída com sucesso do Firestore." + (taskToDelete?.googleCalendarEventId && !firebaseError ? " Evento do Calendar removido (se existia)." : ""));

     } catch (error) {
        console.error('Erro inesperado ao excluir tarefa no Firestore:', error);
        showToast("Erro", "Não foi possível excluir a tarefa do Firestore.", "destructive");
     }
  };
  
  // --- Funções de Hábitos com integração Google Calendar ---
  const addHabit = async (habitData) => {
    if (!user) return null;
    console.log('AppContext addHabit: Dados recebidos:', habitData); // Log

    const newHabit = { 
      // id: `habit-${Date.now()}`, // O ID será gerado pelo Firestore
      ...habitData, 
      progresso_atual: 0, 
      sincronizado_google: false, // Pode usar este flag para indicar sincronização
      googleCalendarEventId: null, // Campo para armazenar o ID do evento do Calendar
    };

    try {
      // 1. Salvar hábito no Firestore
      const { habitId, error: firebaseError } = await firebaseAddHabit(user.uid, newHabit);
      
      if (firebaseError) {
        showToast("Erro ao criar hábito", firebaseError, "destructive");
        return null;
      }
      
      console.log('Hábito adicionado no Firestore com ID:', habitId); // Log
      const habitWithId = { ...newHabit, id: habitId };

      let googleCalendarEventId = null;
      let googleCalendarError = null;

      // 2. Tentar criar evento no Google Calendar se o cliente estiver conectado
      if (googleCalendarInitialized && googleCalendarSignedIn) {
         console.log('Tentando criar evento no Google Calendar para hábito:', habitWithId);
         // TODO: Mapear dados do Hábito para o formato de Evento do Google Calendar.
         // Hábitos podem ser eventos recorrentes. Isso exigirá uma lógica de mapeamento mais complexa.
         // Exemplo básico (tratando como evento único): 
         const event = {
            summary: habitWithId.nome, // Assumindo que 'nome' é o título do hábito
            description: `Meta: ${habitWithId.meta_total} ${habitWithId.tipo_meta}`, // Exemplo de descrição
            start: { dateTime: new Date().toISOString(), timeZone: 'America/Sao_Paulo' }, // Data/hora de início do hábito?
            end: { dateTime: new Date(new Date().getTime() + 60 * 60000).toISOString(), timeZone: 'America/Sao_Paulo' }, // Data/hora de fim?
            // Para hábitos recorrentes, use a propriedade 'recurrence'. Ver documentação da API.
         };

         try {
            const response = await gapi.client.calendar.events.insert({
              calendarId: 'primary',
              resource: event,
            });
            console.log('Evento criado no Google Calendar para hábito:', response.result);
            googleCalendarEventId = response.result.id;
             // Opcional: Salvar o ID do evento do Google Calendar no hábito no Firestore
             try {
                await firebaseUpdateHabit(user.uid, habitId, { googleCalendarEventId: googleCalendarEventId });
                console.log('googleCalendarEventId salvo no Firestore para hábito:', habitId);
                 // Atualizar o estado local do hábito com o eventId
                 setHabits(prevHabits =>
                   prevHabits.map(habit =>
                     habit.id === habitId ? { ...habit, googleCalendarEventId: googleCalendarEventId } : habit
                   )
                 );
             } catch (updateError) {
                console.error('Erro ao salvar googleCalendarEventId no Firestore para hábito:', updateError);
                showToast("Aviso", "Hábito criado e sincronizado com o Calendar, mas falhou ao salvar a referência.", "warning");
             }
         } catch (calendarError) {
            console.error('Erro ao criar evento no Google Calendar para hábito:', calendarError);
            googleCalendarError = calendarError;
            showToast("Aviso", "Hábito criado, mas falhou ao sincronizar com o Google Calendar.", "warning");
         }
      } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
         console.log('Cliente Google Calendar inicializado, mas usuário não conectado. Evento de hábito não criado.');
      } else {
         console.log('Cliente Google Calendar não inicializado. Evento de hábito não criado.');
      }

       // Atualizar estado local (seja com ou sem sincronização bem-sucedida do calendar)
       // Se o eventId foi salvo no Firestore, o estado já foi atualizado acima. Se não, adiciona o hábito sem ele.
       if (!googleCalendarEventId) { // Evita duplicar se o eventId já foi salvo e o estado atualizado
         setHabits(prevHabits => [...prevHabits, habitWithId]);
       }

      if (!googleCalendarError) {
         showToast("🎯 Novo Hábito!", "Hábito adicionado com sucesso." + (googleCalendarEventId ? " Sincronizado com Google Calendar." : ""));
      } else {
         // O aviso de falha na sincronização já foi mostrado acima.
      }

      return habitWithId;
    } catch (error) {
      console.error('AppContext addHabit: Erro inesperado:', error);
      showToast("Erro", "Não foi possível criar o hábito.", "destructive");
      return null;
    }
  };

  const updateHabit = async (habitId, updatedData) => {
    if (!user) return;
    console.log('AppContext updateHabit: Recebido habitId, updatedData:', { habitId, updatedData }); // Log dados recebidos

     // Encontrar o hábito no estado local para obter o googleCalendarEventId
    const habitToUpdate = habits.find(habit => habit.id === habitId);

    // Tentar atualizar evento no Google Calendar se o cliente estiver conectado e o hábito tiver um eventId
     if (googleCalendarInitialized && googleCalendarSignedIn && habitToUpdate?.googleCalendarEventId) {
       console.log('Tentando atualizar evento no Google Calendar para hábito:', habitToUpdate);
       // TODO: Mapear dados do Hábito atualizado para o formato de Evento do Google Calendar.
       // Lidar com a lógica de recorrência se aplicável.
        const updatedEventData = { // Exemplo básico de mapeamento
            summary: updatedData.nome || habitToUpdate.nome,
            description: `Meta: ${updatedData.meta_total || habitToUpdate.meta_total} ${updatedData.tipo_meta || habitToUpdate.tipo_meta}`,
            // Atualizar datas e recorrência se necessário com base em updatedData
        };

       try {
         const { error: calendarError } = await updateCalendarEvent(habitToUpdate.googleCalendarEventId, updatedEventData);
          if (calendarError) {
            console.error('Erro ao atualizar evento no Google Calendar para hábito:', calendarError);
            showToast("Aviso", "Hábito atualizado, mas falhou ao sincronizar com o Google Calendar.", "warning");
          } else {
             console.log('Evento do Google Calendar para hábito atualizado com sucesso.');
          }
       } catch (error) {
          console.error('Erro inesperado ao tentar atualizar evento no Google Calendar para hábito:', error);
          showToast("Aviso", "Hábito atualizado, mas ocorreu um erro inesperado ao sincronizar com o Google Calendar.", "warning");
       }
     } else if (googleCalendarInitialized && googleCalendarSignedIn && !habitToUpdate?.googleCalendarEventId) {
        console.log('Hábito atualizado, mas sem googleCalendarEventId. Evento do Calendar não atualizado.');
     } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
        console.log('Hábito atualizado, cliente Google Calendar inicializado, mas usuário não conectado. Evento não atualizado.');
     } else {
        console.log('Hábito atualizado, cliente Google Calendar não inicializado. Evento não atualizado.');
     }

    // Atualizar hábito no Firestore
    try {
       const { error: firebaseError } = await firebaseUpdateHabit(user.uid, habitId, updatedData);

       if (firebaseError) {
         showToast("Erro ao atualizar hábito no Firestore", firebaseError, "destructive");
         return;
       }

       // Atualizar estado local
       setHabits(prevHabits => 
         prevHabits.map(habit => habit.id === habitId ? { ...habit, ...updatedData } : habit)
       );
       showToast("💪 Hábito Atualizado!", "Seu hábito foi atualizado no Firestore.");
    } catch (error) {
       console.error('Erro inesperado ao atualizar hábito no Firestore:', error);
       showToast("Erro", "Não foi possível atualizar o hábito no Firestore.", "destructive");
    }
  };

  const deleteHabit = async (habitId) => {
    if (!user) return;
    console.log('AppContext deleteHabit: Deletando Hábito com ID:', habitId); // Log

    // Encontrar o hábito no estado local para obter o googleCalendarEventId
    const habitToDelete = habits.find(habit => habit.id === habitId);

    // Tentar excluir evento no Google Calendar se o cliente estiver conectado e o hábito tiver um eventId
    if (googleCalendarInitialized && googleCalendarSignedIn && habitToDelete?.googleCalendarEventId) {
      console.log('Tentando excluir evento no Google Calendar com ID:', habitToDelete.googleCalendarEventId);
      try {
        const { error: calendarError } = await deleteCalendarEvent(habitToDelete.googleCalendarEventId);
         if (calendarError) {
           console.error('Erro ao excluir evento no Google Calendar para hábito:', calendarError);
           // Continuar com a exclusão local e no Firestore mesmo que a exclusão do calendar falhe
           showToast("Aviso", "Hábito excluído, mas falhou ao remover o evento do Google Calendar.", "warning");
         } else {
            console.log('Evento do Google Calendar para hábito excluído com sucesso.');
         }
      } catch (error) {
         console.error('Erro inesperado ao tentar excluir evento do Google Calendar para hábito:', error);
         showToast("Aviso", "Hábito excluído, mas ocorreu um erro inesperado ao sincronizar com o Google Calendar.", "warning");
      }
    } else if (googleCalendarInitialized && googleCalendarSignedIn && !habitToDelete?.googleCalendarEventId) {
       console.log('Hábito deletado, mas sem googleCalendarEventId. Evento do Calendar não excluído.');
    } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
       console.log('Hábito deletado, cliente Google Calendar inicializado, mas usuário não conectado. Evento não excluído.');
    } else {
       console.log('Hábito deletado, cliente Google Calendar não inicializado. Evento não excluído.');
    }

    // Excluir hábito no Firestore
    try {
       const { error: firebaseError } = await firebaseDeleteHabit(user.uid, habitId);

       if (firebaseError) {
         showToast("Erro ao excluir hábito no Firestore", firebaseError, "destructive");
         return;
       }

       // Atualizar estado local
       setHabits(prevHabits => prevHabits.filter(habit => habit.id !== habitId));
       setHabitSessions(prevSessions => prevSessions.filter(session => session.habitId !== habitId)); // Excluir sessões associadas
       showToast("❌ Hábito Removido", "Hábito e sessões excluídos do Firestore." + (habitToDelete?.googleCalendarEventId && !firebaseError ? " Evento do Calendar removido (se existia)." : ""));

    } catch (error) {
       console.error('Erro inesperado ao excluir hábito no Firestore:', error);
       showToast("Erro", "Não foi possível excluir o hábito do Firestore.", "destructive");
    }
  };


  const addHabitSession = async (sessionData) => {
    if (!user) return null;
    console.log('AppContext addHabitSession: Dados recebidos:', sessionData); // Log dados recebidos

    // Criar sessão de hábito no Firestore
    try {
       const newSession = { // Renomeado para clareza
         ...sessionData,
         data: new Date().toISOString(),
         concluido: true,
         createdAt: new Date().toISOString(),
         userId: user.uid // Adicionar referência ao usuário para regras de segurança
       };

       const { sessionId, error: firebaseError } = await firebaseAddHabitSession(user.uid, newSession);
       
       if (firebaseError) {
         console.error('Erro ao registrar sessão no Firestore:', firebaseError);
         showToast("Erro", "Não foi possível registrar a sessão de hábito.", "destructive");
         return null;
       }
       
       console.log('Sessão adicionada no Firestore com ID:', sessionId); // Log ID criado
       const sessionWithId = { ...newSession, id: sessionId };

       // Atualizar estado local das sessões
       setHabitSessions(prevSessions => [...prevSessions, sessionWithId]);
       
       // Atualizar progresso do hábito associado (no Firestore e estado local)
       const habit = habits.find(h => h.id === sessionData.habitId);
       if (habit) {
         const newProgress = Math.min(habit.progresso_atual + sessionData.quantidade, habit.meta_total);
         await updateHabit(habit.id, { progresso_atual: newProgress }); // Chama a função updateHabit que já tem integração Calendar
       }

        // TODO: Considerar se o registro de sessão deve criar/atualizar um evento no Google Calendar.
        // Por exemplo, um evento para o dia em que o hábito foi concluído.
        // Verifique googleCalendarInitialized, googleCalendarSignedIn.
        // Se aplicável, chame createCalendarEvent ou updateCalendarEvent.
        // Se criar um evento, salve o eventId na sessão de hábito no Firestore.

       showToast("🎉 Sessão Registrada!", "Bom trabalho! Sessão de hábito salva no Firestore.");
       return sessionWithId;

    } catch (error) {
       console.error('AppContext addHabitSession: Erro inesperado:', error);
       showToast("Erro", "Ocorreu um erro inesperado ao registrar a sessão de hábito.", "destructive");
       return null;
    }

  };

  const login = async (email, password) => {
    const { user, userData, error } = await loginWithEmail(email, password);
    if (error) {
      showToast("😕 Ops!", error, "destructive");
      return false;
    }
    showToast("👋 Bem-vindo(a) de volta!", "Login realizado com sucesso!");
    return true;
  };

  const signup = async (email, password, name) => {
    const { user, userData, error } = await signupWithEmail(email, password);
    if (error) {
      showToast("😕 Ops!", error, "destructive");
      return false;
    }
    // Se o signup for bem-sucedido, o usuário é criado no Firebase Authentication.
    // Agora precisamos salvar os dados adicionais (como o nome) no Firestore.
    if (user) {
       try {
         // Chamar uma nova função para salvar dados adicionais no Firestore
         await saveUserData(user.uid, { name: name, email: user.email }); // user.email pode ser útil
         setUserName(name); // Atualizar o estado local do nome imediatamente após o cadastro
         console.log('Dados adicionais do usuário salvos no Firestore.');
       } catch (firestoreError) {
         console.error('Erro ao salvar dados adicionais do usuário no Firestore:', firestoreError);
         showToast("Aviso", "Conta criada, mas falhou ao salvar seus dados adicionais.", "warning");
         // Decida se isso deve impedir o login ou apenas mostrar um aviso
       }
    }

    showToast("🎉 Conta Criada!", "Seu cadastro foi realizado com sucesso!");
    return true; // Retornar true em caso de sucesso
  };

  const handleGoogleAuth = async () => {
    const { user, userData, error } = await loginWithGoogle();
    if (error) {
      showToast("😕 Ops!", error, "destructive");
      return false;
    }
    showToast("👋 Bem-vindo(a)!", "Login com Google realizado com sucesso!");
    return true; // Retornar true em caso de sucesso
  };

  const logout = async () => {
    const { error } = await firebaseLogout();
    if (error) {
      showToast("😕 Ops!", error, "destructive");
      return;
    }
    // Opcional: deslogar do cliente Google Calendar também
    // gapi.auth2.getAuthInstance().signOut(); 
    showToast("👋 Até logo!", "Você foi desconectado.");
  };

  // Atualizar addTodo para usar firebaseAddTodo - Já com integração Calendar (mas para To-Dos)
  const addTodo = async (todoData) => {
    if (!user) return null;
    console.log('AppContext addTodo: Dados recebidos:', todoData); // Log

    try {
      // 1. Salvar To-Do no Firestore
      const { todoId, error: firebaseError } = await firebaseAddTodo(user.uid, todoData);

      if (firebaseError) {
        showToast("Erro ao criar To-Do", firebaseError, "destructive");
        return null;
      }

       console.log('To-Do adicionado no Firestore com ID:', todoId); // Log
       const todoWithId = { ...todoData, id: todoId };

      let googleCalendarEventId = null;
      let googleCalendarError = null;

      // 2. Tentar criar evento no Google Calendar se o cliente estiver conectado
      if (googleCalendarInitialized && googleCalendarSignedIn) {
         console.log('Tentando criar evento no Google Calendar para To-Do:', todoWithId);
         // TODO: Mapear dados do To-Do para o formato de Evento do Google Calendar.
         // To-Dos podem não ter datas/horas definidas como tarefas ou hábitos.
         // Decida como representar um To-Do no Google Calendar (ex: evento de dia inteiro, sem data, etc.).
         const event = { // Exemplo básico de mapeamento
            summary: todoWithId.title, // Assumindo que 'title' é o título do To-Do
            description: todoWithId.description || '',
            // Defina start e end com base na estrutura do seu To-Do. 
            // Se não tiver data, talvez não crie um evento ou crie um evento de dia inteiro.
            // start: { date: new Date().toISOString().split('T')[0] }, // Exemplo: evento de dia inteiro hoje
            // end: { date: new Date().toISOString().split('T')[0] },
         };

         // Exemplo: apenas criar evento se houver data_inicial (se To-Do tiver campo de data)
         if (todoWithId.data_inicial) {
            event.start = { dateTime: new Date(todoWithId.data_inicial).toISOString(), timeZone: 'America/Sao_Paulo' };
            event.end = { dateTime: todoWithId.data_final ? new Date(todoWithId.data_final).toISOString() : new Date(new Date(todoWithId.data_inicial).getTime() + 30 * 60000).toISOString(), timeZone: 'America/Sao_Paulo' };
         }
         // TODO: Remova o if acima se To-Do tiver sempre data/hora ou se quiser outra representação.


         try {
            const response = await gapi.client.calendar.events.insert({
              calendarId: 'primary',
              resource: event,
            });
            console.log('Evento criado no Google Calendar para To-Do:', response.result);
            googleCalendarEventId = response.result.id;
             // Opcional: Salvar o ID do evento do Google Calendar no To-Do no Firestore
             try {
                await firebaseUpdateTodo(user.uid, todoId, { googleCalendarEventId: googleCalendarEventId });
                console.log('googleCalendarEventId salvo no Firestore para To-Do:', todoId);
                 // Atualizar o estado local do To-Do com o eventId
                 setTodos(prevTodos =>
                   prevTodos.map(todo =>
                     todo.id === todoId ? { ...todo, googleCalendarEventId: googleCalendarEventId } : todo
                   )
                 );
             } catch (updateError) {
                console.error('Erro ao salvar googleCalendarEventId no Firestore para To-Do:', updateError);
                showToast("Aviso", "To-Do criado e sincronizado com o Calendar, mas falhou ao salvar a referência.", "warning");
             }
         } catch (calendarError) {
            console.error('Erro ao criar evento no Google Calendar para To-Do:', calendarError);
            googleCalendarError = calendarError;
            showToast("Aviso", "To-Do criado, mas falhou ao sincronizar com o Google Calendar.", "warning");
         }
      } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
         console.log('Cliente Google Calendar inicializado, mas usuário não conectado. Evento de To-Do não criado.');
      } else {
         console.log('Cliente Google Calendar não inicializado. Evento de To-Do não criado.');
      }

       // Atualizar estado local (seja com ou sem sincronização bem-sucedida do calendar)
       // Se o eventId foi salvo no Firestore, o estado já foi atualizado acima. Se não, adiciona o To-Do sem ele.
       if (!googleCalendarEventId) { // Evita duplicar se o eventId já foi salvo e o estado atualizado
         setTodos(prevTodos => [...prevTodos, todoWithId]);
       }

      if (!googleCalendarError) {
         showToast("✨ Novo To-Do!", "To-Do criado com sucesso." + (googleCalendarEventId ? " Sincronizado com Google Calendar." : ""));
      } else {
         // O aviso de falha na sincronização já foi mostrado acima.
      }

      return todoWithId;

    } catch (error) {
      console.error('AppContext addTodo: Erro inesperado:', error);
      showToast("Erro", "Não foi possível criar o To-Do.", "destructive");
      return null;
    }
  };

  const updateTodo = async (todoId, updatedData) => {
     if (!user) return;
     console.log('AppContext updateTodo: Recebido todoId, updatedData:', { todoId, updatedData }); // Log

     // Encontrar o To-Do no estado local para obter o googleCalendarEventId
    const todoToUpdate = todos.find(todo => todo.id === todoId);

    // Tentar atualizar evento no Google Calendar se o cliente estiver conectado e o To-Do tiver um eventId
     if (googleCalendarInitialized && googleCalendarSignedIn && todoToUpdate?.googleCalendarEventId) {
       console.log('Tentando atualizar evento no Google Calendar para To-Do:', todoToUpdate);
       // TODO: Mapear dados do To-Do atualizado para o formato de Evento do Google Calendar.
       const updatedEventData = { // Exemplo básico de mapeamento (ajuste conforme a estrutura do To-Do)
           summary: updatedData.title || todoToUpdate.title,
           description: updatedData.description || todoToUpdate.description || '',
           // Atualizar datas se necessário com base em updatedData
        };
        // Se To-Do tiver campos de data (ex: data_inicial, data_final), atualize start/end aqui
        if (updatedData.data_inicial !== undefined) {
           updatedEventData.start = updatedData.data_inicial ? { dateTime: new Date(updatedData.data_inicial).toISOString(), timeZone: 'America/Sao_Paulo' } : null;
           // Ajustar data de fim se a data de início mudou e a data de fim não foi explicitamente atualizada
           const endDateTime = updatedData.data_final !== undefined 
                               ? (updatedData.data_final ? new Date(updatedData.data_final).toISOString() : null)
                               : (todoToUpdate.data_final ? new Date(todoToUpdate.data_final).toISOString() : null);
           updatedEventData.end = endDateTime ? { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' } : null;
        }
        // TODO: Ajustar o mapeamento acima para corresponder exatamente aos campos de data/hora do seu To-Do.

       try {
         // Note: updateCalendarEvent que você forneceu no googleCalendar.js espera o objeto de tarefa completo. 
         // Você pode precisar ajustar isso ou passar os dados mapeados (updatedEventData).
         // Chamando com updatedEventData mapeado:
         const { error: calendarError } = await updateCalendarEvent(todoToUpdate.googleCalendarEventId, updatedEventData);

          if (calendarError) {
            console.error('Erro ao atualizar evento no Google Calendar para To-Do:', calendarError);
            showToast("Aviso", "To-Do atualizado, mas falhou ao sincronizar com o Google Calendar.", "warning");
          } else {
             console.log('Evento do Google Calendar para To-Do atualizado com sucesso.');
          }
       } catch (error) {
          console.error('Erro inesperado ao tentar atualizar evento no Google Calendar para To-Do:', error);
          showToast("Aviso", "To-Do atualizado, mas ocorreu um erro inesperado ao sincronizar com o Google Calendar.", "warning");
       }
     } else if (googleCalendarInitialized && googleCalendarSignedIn && !todoToUpdate?.googleCalendarEventId) {
        console.log('To-Do atualizado, mas sem googleCalendarEventId. Evento do Calendar não atualizado.');
     } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
        console.log('To-Do atualizado, cliente Google Calendar inicializado, mas usuário não conectado. Evento não atualizado.');
     } else {
        console.log('To-Do atualizado, cliente Google Calendar não inicializado. Evento não atualizado.');
     }

     // Atualizar To-Do no Firestore
     try {
       const { error: firebaseError } = await firebaseUpdateTodo(user.uid, todoId, updatedData);

       if (firebaseError) {
         showToast("Erro ao atualizar To-Do no Firestore", firebaseError, "destructive");
         return;
       }

       // Atualizar estado local
       setTodos(prevTodos => 
         prevTodos.map(todo => todo.id === todoId ? { ...todo, ...updatedData } : todo)
       );
       showToast("👍 Atualizado!", "To-Do atualizado com sucesso no Firestore.");
     } catch (error) {
       console.error('Erro inesperado ao atualizar To-Do no Firestore:', error);
       showToast("Erro", "Não foi possível atualizar o To-Do no Firestore.", "destructive");
     }
  };

  const deleteTodo = async (todoId) => {
     if (!user) return;
     console.log('AppContext deleteTodo: Deletando To-Do com ID:', todoId); // Log

     // Encontrar o To-Do no estado local para obter o googleCalendarEventId
     const todoToDelete = todos.find(todo => todo.id === todoId);

     // Tentar excluir evento no Google Calendar se o cliente estiver conectado e o To-Do tiver um eventId
     if (googleCalendarInitialized && googleCalendarSignedIn && todoToDelete?.googleCalendarEventId) {
       console.log('Tentando excluir evento no Google Calendar com ID:', todoToDelete.googleCalendarEventId);
       try {
         const { error: calendarError } = await deleteCalendarEvent(todoToDelete.googleCalendarEventId);
          if (calendarError) {
            console.error('Erro ao excluir evento no Google Calendar para To-Do:', calendarError);
            // Continuar com a exclusão local e no Firestore mesmo que a exclusão do calendar falhe
            showToast("Aviso", "To-Do excluído, mas falhou ao remover o evento do Google Calendar.", "warning");
          } else {
             console.log('Evento do Google Calendar para To-Do excluído com sucesso.');
          }
       } catch (error) {
          console.error('Erro inesperado ao tentar excluir evento do Google Calendar para To-Do:', error);
          showToast("Aviso", "To-Do excluído, mas ocorreu um erro inesperado ao sincronizar com o Google Calendar.", "warning");
       }
     } else if (googleCalendarInitialized && googleCalendarSignedIn && !todoToDelete?.googleCalendarEventId) {
        console.log('To-Do deletado, mas sem googleCalendarEventId. Evento do Calendar não excluído.');
     } else if (googleCalendarInitialized && !googleCalendarSignedIn) {
        console.log('To-Do deletado, cliente Google Calendar inicializado, mas usuário não conectado. Evento não excluído.');
     } else {
        console.log('To-Do deletado, cliente Google Calendar não inicializado. Evento não excluído.');
     }

     // Excluir To-Do no Firestore
     try {
       const { error: firebaseError } = await firebaseDeleteTodo(user.uid, todoId);

       if (firebaseError) {
         showToast("Erro ao excluir To-Do no Firestore", firebaseError, "destructive");
         return;
       }

       // Atualizar estado local
       setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
       showToast("🗑️ Removido!", "To-Do excluído com sucesso do Firestore." + (todoToDelete?.googleCalendarEventId && !firebaseError ? " Evento do Calendar removido (se existia)." : ""));

     } catch (error) {
       console.error('AppContext deleteTodo: Erro inesperado:', error);
       showToast("Erro", "Não foi possível excluir o To-Do do Firestore.", "destructive");
     }
  };

  // NOVO: Função para atualizar o nome do usuário
  const updateUserName = async (newName) => {
    if (!user) {
      showToast("Erro", "Usuário não autenticado.", "error");
      return;
    }
    try {
      await saveUserData(user.uid, { name: newName });
      setUserName(newName); // Atualiza o estado local no contexto
      showToast("Sucesso", "Nome atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar nome do usuário no Firebase:", error);
      showToast("Erro", "Não foi possível atualizar o nome.", "error");
      throw error; // Re-lança o erro para que o componente chamador possa tratá-lo, se necessário
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  const value = {
    tasks, setTasks, addTask, updateTask, updateTaskStatusDnD, deleteTask,
    boards, setBoards,
    habits, setHabits, addHabit, updateHabit, deleteHabit,
    habitSessions, setHabitSessions, addHabitSession,
    todos, setTodos, addTodo, updateTodo, deleteTodo,
    taskStatusOptions, habitMetaTypeOptions, habitFrequencyOptions,
    showToast,
    isAuthenticated, user, login, signup, handleGoogleAuth, logout,
    userName,
    googleCalendarInitialized, // Expor o status de inicialização
    googleCalendarSignedIn, // Expor o status de login
    handleGoogleCalendarSignIn, // Expor a função de login
    handleGoogleCalendarSignOut, // Expor a função de logout
    updateUserName, // <-- NOVO: Expor a função de atualização de nome
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};