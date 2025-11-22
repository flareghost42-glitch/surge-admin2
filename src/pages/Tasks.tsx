
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task, TaskStatus } from '../types';
import { UserIcon } from '../components/Icons';
import TaskModal from '../components/TaskModal';
import { createTask, updateTask } from '../services/adminService';

const TaskCard: React.FC<{ task: Task; onClick: (task: Task) => void; staffMap: Record<string, string> }> = ({ task, onClick, staffMap }) => {
    const priorityColors = {
        Low: 'border-l-blue-500',
        Medium: 'border-l-orange-500',
        High: 'border-l-red-500'
    };

    return (
        <div 
            onClick={() => onClick(task)}
            className={`bg-gray-800 p-3 rounded-md border border-gray-700 ${priorityColors[task.priority] || 'border-l-gray-500'} border-l-4 cursor-pointer hover:bg-gray-750 transition-colors`}
        >
            <p className="font-semibold text-sm text-white">{task.title}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
            <div className="flex justify-between items-center mt-3 border-t border-gray-700 pt-2">
                <div className="flex items-center gap-1">
                     <UserIcon className="w-3 h-3 text-gray-500" />
                     <span className="text-xs text-gray-400">
                        {task.assignedTo ? (staffMap[task.assignedTo] || 'Unknown') : 'Unassigned'}
                     </span>
                </div>
                <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">{task.priority}</span>
            </div>
        </div>
    );
}

const TaskColumn: React.FC<{ title: string; tasks: Task[]; onTaskClick: (task: Task) => void; staffMap: Record<string, string> }> = ({ title, tasks, onTaskClick, staffMap }) => {
    return (
        <div className="flex-1 bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">{title}</h3>
                <span className="bg-gray-700 text-xs px-2 py-1 rounded-full text-gray-300">{tasks.length}</span>
            </div>
            <div className="space-y-3 h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={onTaskClick} staffMap={staffMap} />
                ))}
            </div>
        </div>
    )
}

const Tasks: React.FC = () => {
    const { state } = useAppContext();
    const { tasks, staff } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const staffMap = React.useMemo(() => {
        return staff.reduce((acc, s) => {
            acc[s.id] = s.name;
            return acc;
        }, {} as Record<string, string>);
    }, [staff]);

    const pendingTasks = tasks.filter(t => t.status === TaskStatus.Pending);
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.InProgress);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.Completed);

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData: Partial<Task>) => {
        if (taskData.id) {
            await updateTask(taskData.id, taskData);
        } else {
            await createTask(taskData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Task Management</h2>
                    <p className="text-gray-400 text-sm">Kanban board for tracking hospital tasks and assignments.</p>
                </div>
                <button 
                    onClick={handleCreateTask}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <span>+ New Task</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TaskColumn title="Pending" tasks={pendingTasks} onTaskClick={handleEditTask} staffMap={staffMap} />
                <TaskColumn title="In Progress" tasks={inProgressTasks} onTaskClick={handleEditTask} staffMap={staffMap} />
                <TaskColumn title="Completed" tasks={completedTasks} onTaskClick={handleEditTask} staffMap={staffMap} />
            </div>

            <TaskModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveTask}
                staff={staff}
                initialTask={selectedTask}
            />
        </div>
    )
};

export default Tasks;
