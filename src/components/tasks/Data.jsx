export const initialData = {
    columns: {
      todo: {
        id: 'todo',
        title: 'A Fazer',
        taskIds: ['task-1', 'task-2'],
      },
      doing: {
        id: 'doing',
        title: 'Fazendo',
        taskIds: ['task-3'],
      },
      done: {
        id: 'done',
        title: 'Feito',
        taskIds: [],
      },
    },
    tasks: {
      'task-1': { id: 'task-1', content: 'Estudar React' },
      'task-2': { id: 'task-2', content: 'Revisar dnd-kit' },
      'task-3': { id: 'task-3', content: 'Enviar relatório' },
    },
  };
  