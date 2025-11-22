
import { ChatMessage } from "../../lib/openrouter";

export const buildSystemContext = (state: any): ChatMessage => {
    // Summarize state to save tokens while providing context
    const summary = {
        activeEmergencies: state.emergencies.map((e: any) => `${e.type} in ${e.location} (${e.severity})`),
        pendingTasks: state.tasks.filter((t: any) => t.status === 'Pending').map((t: any) => `${t.priority} Priority: ${t.title} (${t.assignedTo})`),
        bedStatus: {
            total: state.beds.length,
            occupied: state.beds.filter((b: any) => b.status === 'Occupied').length,
            free: state.beds.filter((b: any) => b.status === 'Free').length
        },
        staffStatus: state.staff.map((s: any) => `${s.name}: ${s.status} (${s.workload}% load)`),
        criticalPatients: state.patients.filter((p: any) => p.condition === 'Critical').map((p: any) => `${p.name} in Room ${p.bedId}`),
        lowSupplies: state.supplies.filter((s: any) => s.level < s.criticalThreshold).map((s: any) => s.name),
        timestamp: new Date().toLocaleString()
    };

    return {
        role: 'system',
        content: `You are the SurgeMind AI Assistant, an advanced hospital operating system. 
        
        Current Hospital Status (REAL-TIME DATA):
        ${JSON.stringify(summary, null, 2)}
        
        Your capabilities:
        1. Answer questions about bed availability, staff workload, and emergencies.
        2. Summarize the current state of the hospital.
        3. Identify bottlenecks or critical situations based on the data above.
        
        Guidelines:
        - Be concise and professional.
        - Use the data provided above to answer. Do not make up facts.
        - If the user asks about something not in the data (like specific medical history), explain you only have access to operational data.
        - Always speak as an assistant to the Hospital Administrator.
        `
    };
};
