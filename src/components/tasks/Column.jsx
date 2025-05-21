import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

export default function Column({ column, tasks }) {
  return (
    <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 12, width: 300 }}>
      <h3>{column.title}</h3>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
}
