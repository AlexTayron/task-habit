import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import Column from './Column';
import { useState } from 'react';
import { initialData } from './Data';

export default function Board() {
  const [data, setData] = useState(initialData);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    let sourceColumnId, destinationColumnId;

    for (const [colId, column] of Object.entries(data.columns)) {
      if (column.taskIds.includes(active.id)) sourceColumnId = colId;
      if (column.taskIds.includes(over.id)) destinationColumnId = colId;
    }

    if (!sourceColumnId || !destinationColumnId) return;

    const sourceTaskIds = [...data.columns[sourceColumnId].taskIds];
    const destinationTaskIds = [...data.columns[destinationColumnId].taskIds];

    // Remover da coluna de origem
    const index = sourceTaskIds.indexOf(active.id);
    sourceTaskIds.splice(index, 1);

    // Inserir na nova coluna na posição do item "over"
    const overIndex = destinationTaskIds.indexOf(over.id);
    destinationTaskIds.splice(overIndex, 0, active.id);

    const newState = {
      ...data,
      columns: {
        ...data.columns,
        [sourceColumnId]: { ...data.columns[sourceColumnId], taskIds: sourceTaskIds },
        [destinationColumnId]: { ...data.columns[destinationColumnId], taskIds: destinationTaskIds },
      },
    };

    setData(newState);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {Object.values(data.columns).map(column => {
          const tasks = column.taskIds.map(taskId => data.tasks[taskId]);
          return <Column key={column.id} column={column} tasks={tasks} />;
        })}
      </div>
    </DndContext>
  );
}
