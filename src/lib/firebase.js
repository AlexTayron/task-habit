import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBd9MWHzCrF9B3mJlZ2_Pc_oeQKjCYRBP4",
  authDomain: "task-habitt.firebaseapp.com",
  projectId: "task-habitt",
  storageBucket: "task-habitt.firebasestorage.app",
  messagingSenderId: "404523937995",
  appId: "1:404523937995:web:9544d3d68d8cbbde52ab4e"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Coleção raiz para dados dos usuários
const usersCollection = collection(db, 'users');

// Função auxiliar para obter a referência do documento do usuário
export const getUserDocRef = (uid) => doc(usersCollection, uid);

// Função para salvar dados adicionais do usuário no Firestore
export const saveUserData = async (uid, data) => {
  try {
    const userDocRef = getUserDocRef(uid);
    await updateDoc(userDocRef, data, { merge: true }); // Usar merge para não sobrescrever todo o documento se ele já existir (ex: criado com email/senha)
    console.log('Dados do usuário salvos/atualizados no Firestore:', data);
    return { error: null };
  } catch (error) {
    console.error('Erro ao salvar dados do usuário no Firestore:', error);
    return { error: error.message };
  }
};

// Funções de autenticação
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Dados do usuário (como nome) serão carregados pelo onAuthStateChanged no AppContext
    console.log('Usuário logado com email/senha:', user);
    return { user: user, error: null };
  } catch (error) {
    console.error('Erro ao fazer login com email/senha:', error);
    return { user: null, error: error.message };
  }
};

export const signupWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // NOTA: Não salvar dados adicionais aqui. Isso será feito no AppContext após a criação.
    // Apenas garantir que o documento base do usuário existe se necessário (embora o onAuthStateChanged no AppContext deva cuidar disso)

    console.log('Usuário criado com email/senha:', user);
    return { user: user, error: null };
  } catch (error) {
    console.error('Erro ao criar usuário com email/senha:', error);
    return { user: null, error: error.message };
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Verificar se o usuário já existe no Firestore. Se não, criar um documento inicial.
    const userDocRef = getUserDocRef(user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Criar um documento básico para o novo usuário Google
      await saveUserData(user.uid, { 
        email: user.email,
        name: user.displayName || null, // Salvar o nome do Google se disponível
        createdAt: serverTimestamp() 
      });
       console.log('Novo usuário Google salvo no Firestore.');
    } else {
       console.log('Usuário Google existente. Dados não sobrescritos durante o login.');
    }

    console.log('Usuário logado com Google:', user);
    // Dados do usuário (incluindo nome) serão carregados pelo onAuthStateChanged no AppContext
    return { user: user, error: null };
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    return { user: null, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('Usuário deslogado do Firebase.');
    return { error: null };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { error: error.message };
  }
};

// Funções do Firestore
export const getUserData = async (uid) => {
  try {
    const userDocRef = getUserDocRef(uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      console.log('Dados do usuário carregados do Firestore:', userData);
      // TODO: Carregar subcoleções (tasks, habits, todos, etc.) aqui ou no AppContext
      // Como estamos carregando no AppContext no onAuthStateChanged, manter lá por enquanto.
      
      // Certificar-se de que o campo 'name' está sendo carregado
      return { ...userData, name: userData.name || null }; // Retornar userData, incluindo name

    } else {
      console.log('Documento do usuário não encontrado no Firestore para UID:', uid);
      // Se o documento não existe, pode ser um novo usuário criado apenas no Authentication
      // Criar um documento inicial básico
       await saveUserData(uid, { email: auth.currentUser?.email, createdAt: serverTimestamp() });
       console.log('Documento inicial do usuário criado no Firestore para UID:', uid);
       return { name: null, email: auth.currentUser?.email }; // Retornar dados básicos após criar
    }
  } catch (error) {
    console.error('Erro ao obter dados do usuário do Firestore:', error);
    return null; // Retornar null ou um objeto de erro em caso de falha
  }
};

export const updateUserData = async (userId, data) => {
  try {
    await setDoc(doc(db, 'users', userId), data, { merge: true });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Funções para Tarefas
export const addTask = async (uid, taskData) => {
  try {
    // Validação básica (pode ser mais robusta)
    if (!taskData.título || !taskData.status) {
      // Não lançar erro, apenas retornar com erro
      return { taskId: null, task: null, error: "Título e status são obrigatórios." };
    }

    const tasksCollectionRef = collection(getUserDocRef(uid), 'tasks');
    // Adicionar campos adicionais necessários
    const newTask = {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: uid // Adicionar referência ao usuário para regras de segurança
    };

    const docRef = await addDoc(tasksCollectionRef, newTask);
    console.log("Tarefa escrita com ID: ", docRef.id);
    return { taskId: docRef.id, task: { id: docRef.id, ...newTask }, error: null };

  } catch (e) {
    console.error("Erro ao adicionar documento de tarefa: ", e);
    return { taskId: null, task: null, error: e.message };
  }
};

export const updateTask = async (uid, taskId, updatedData) => {
  try {
    const taskDocRef = doc(collection(getUserDocRef(uid), 'tasks'), taskId);
    // Remover campos que não devem ser atualizados diretamente (se houver)
    const dataToUpdate = { ...updatedData };
    delete dataToUpdate.id; // Não atualizar o ID do documento
    // Atualizar timestamp se não estiver nos dados de atualização
     if (!dataToUpdate.updatedAt) {
        dataToUpdate.updatedAt = serverTimestamp();
     }

    await updateDoc(taskDocRef, dataToUpdate);
    console.log("Tarefa atualizada com ID: ", taskId);
    return { error: null };

  } catch (e) {
    console.error("Erro ao atualizar documento de tarefa: ", e);
    return { error: e.message };
  }
};

export const deleteTask = async (uid, taskId) => {
  try {
    const taskDocRef = doc(collection(getUserDocRef(uid), 'tasks'), taskId);
    await deleteDoc(taskDocRef);
    console.log("Tarefa excluída com ID: ", taskId);
    return { error: null };

  } catch (e) {
    console.error("Erro ao excluir documento de tarefa: ", e);
    return { error: e.message };
  }
};

// Funções para Hábitos
export const addHabit = async (uid, habitData) => {
  try {
    // Validação básica
    if (!habitData.título || !habitData.meta_total || !habitData.tipo_de_meta) {
       return { habitId: null, error: "Título, meta total e tipo de meta são obrigatórios." };
    }
    const habitsCollectionRef = collection(getUserDocRef(uid), 'habits');
    const newHabit = {
      ...habitData,
      progresso_atual: habitData.progresso_atual || 0, // Garantir que progresso_atual existe
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: uid // Adicionar referência ao usuário
    };

    const docRef = await addDoc(habitsCollectionRef, newHabit);
    console.log("Hábito escrito com ID: ", docRef.id);
    return { habitId: docRef.id, error: null };

  } catch (e) {
    console.error("Erro ao adicionar documento de hábito: ", e);
    return { habitId: null, error: e.message };
  }
};

export const updateHabit = async (uid, habitId, updatedData) => {
  try {
    const habitDocRef = doc(collection(getUserDocRef(uid), 'habits'), habitId);
    const dataToUpdate = { ...updatedData };
    delete dataToUpdate.id;
     if (!dataToUpdate.updatedAt) {
        dataToUpdate.updatedAt = serverTimestamp();
     }
    await updateDoc(habitDocRef, dataToUpdate);
    console.log("Hábito atualizado com ID: ", habitId);
    return { error: null };

  } catch (e) {
    console.error("Erro ao atualizar documento de hábito: ", e);
    return { error: e.message };
  }
};

export const deleteHabit = async (uid, habitId) => {
  try {
    const habitDocRef = doc(collection(getUserDocRef(uid), 'habits'), habitId);
    await deleteDoc(habitDocRef);
    console.log("Hábito excluído com ID: ", habitId);
    // TODO: Excluir sessões de hábito associadas. Pode ser feito aqui ou no AppContext.
    // Excluindo sessões no AppContext atualmente.
    return { error: null };

  } catch (e) {
    console.error("Erro ao excluir documento de hábito: ", e);
    return { error: e.message };
  }
};

// Funções para Sessões de Hábitos
export const addHabitSession = async (uid, sessionData) => {
  try {
    // Validação básica
    if (!sessionData.habitId || sessionData.quantidade === undefined) {
        return { sessionId: null, error: "ID do hábito e quantidade são obrigatórios." };
    }

    const habitSessionsCollectionRef = collection(getUserDocRef(uid), 'habitSessions');

    const newSession = {
        ...sessionData,
        data: sessionData.data ? new Date(sessionData.data) : serverTimestamp(), // Usar timestamp do servidor se data não for fornecida
        concluido: sessionData.concluido !== undefined ? sessionData.concluido : true,
        createdAt: serverTimestamp(),
        userId: uid // Adicionar referência ao usuário
    };

    const docRef = await addDoc(habitSessionsCollectionRef, newSession);
    console.log("Sessão de hábito escrita com ID: ", docRef.id);
    return { sessionId: docRef.id, error: null };

  } catch (e) {
    console.error("Erro ao adicionar documento de sessão de hábito: ", e);
    return { sessionId: null, error: e.message };
  }
};

// Funções para To-Dos
export const firebaseAddTodo = async (uid, todoData) => { // Renomeada para clareza
  try {
    // Validação básica
    if (!todoData.title) { // Usando 'title' como campo obrigatório
       return { todoId: null, error: "Título do To-Do é obrigatório." };
    }
    const todosCollectionRef = collection(getUserDocRef(uid), 'todos');
    const newTodo = {
      ...todoData,
      completed: todoData.completed || false, // Garantir campo completed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: uid // Adicionar referência ao usuário
    };

    const docRef = await addDoc(todosCollectionRef, newTodo);
    console.log("To-Do escrito com ID: ", docRef.id);
    return { todoId: docRef.id, error: null };

  } catch (e) {
    console.error("Erro ao adicionar documento de To-Do: ", e);
    return { todoId: null, error: e.message };
  }
};

export const firebaseUpdateTodo = async (uid, todoId, updatedData) => { // Renomeada para clareza
  try {
    const todoDocRef = doc(collection(getUserDocRef(uid), 'todos'), todoId);
    const dataToUpdate = { ...updatedData };
    delete dataToUpdate.id;
     if (!dataToUpdate.updatedAt) {
        dataToUpdate.updatedAt = serverTimestamp();
     }
    await updateDoc(todoDocRef, dataToUpdate);
    console.log("To-Do atualizado com ID: ", todoId);
    return { error: null };

  } catch (e) {
    console.error("Erro ao atualizar documento de To-Do: ", e);
    return { error: e.message };
  }
};

export const firebaseDeleteTodo = async (uid, todoId) => { // Renomeada para clareza
  try {
    const todoDocRef = doc(collection(getUserDocRef(uid), 'todos'), todoId);
    await deleteDoc(todoDocRef);
    console.log("To-Do excluído com ID: ", todoId);
    return { error: null };

  } catch (e) {
    console.error("Erro ao excluir documento de To-Do: ", e);
    return { error: e.message };
  }
};

export { auth, db }; 