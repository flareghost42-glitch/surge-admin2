
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Task, TaskStatus } from '../types';

const TaskColumn: React.FC<{ title: string; tasks: Task[]; }> = ({ title, tasks }) => {
    return (
        <div className="flex-1 bg-gray-900 p-4 rounded-lg">
            <h3 className="font-bold mb-4 text-white">{title} ({tasks.length})</h3>
            <div className="space-y-3 h-[60vh] overflow-y-auto">
                {tasks.map(task => (
                    <div key={task.id} className="bg-gray-800 p-3 rounded-md border border-gray-700">
                        <p className="font-semibold text-sm">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

const Tasks: React.FC = () => {
    const { state } = useAppContext();
    const { tasks } = state;

    const pendingTasks = tasks.filter(t => t.status === TaskStatus.Pending);
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.InProgress);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Completed);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-2">Task Management</h2>
                <p className="text-gray-400">Kanban board for tracking hospital tasks.</p>
            </div>
            <div className="flex gap-6">
                <TaskColumn title="Pending" tasks={pendingTasks} />
                <TaskColumn title="In Progress" tasks={inProgressTasks} />
                <TaskColumn title="Completed" tasks={completedTasks} />
            </div>
        </div>
    )
};

export default Tasks;
