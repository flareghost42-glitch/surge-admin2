import { supabase } from "../lib/supabase";

// Helper to find best staff based on current workload
async function getBestStaff() {
  try {
    // 1. Get active staff
    const { data: staff } = await supabase
      .from("staff")
      .select("id, status")
      .eq("status", "active");

    // If no active staff, try finding anyone not offline
    let availableStaff = staff;
    if (!availableStaff || availableStaff.length === 0) {
        const { data: allStaff } = await supabase
            .from("staff")
            .select("id, status")
            .neq("status", "offline");
        availableStaff = allStaff;
    }

    if (!availableStaff || availableStaff.length === 0) return null;

    // 2. Get pending task counts
    const { data: tasks } = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("status", "pending");

    const load: Record<string, number> = {};
    availableStaff.forEach((s) => (load[s.id] = 0));
    
    if (tasks) {
      tasks.forEach((t) => {
          if (load[t.assigned_to] !== undefined) {
              load[t.assigned_to]++;
          }
      });
    }

    // 3. Find staff with minimum load
    let bestStaffId = availableStaff[0].id;
    let minLoad = Infinity;

    for (const s of availableStaff) {
        const currentLoad = load[s.id] || 0;
        if (currentLoad < minLoad) {
            minLoad = currentLoad;
            bestStaffId = s.id;
        }
    }

    return bestStaffId;
  } catch (e) {
    console.error("Error finding best staff", e);
    return null;
  }
}

export async function autoGenerateEmergencyTask(emergency: any) {
  console.log("⚡ AI Agent: Processing Emergency...", emergency);
  
  const instruction = `
    Emergency triggered in room ${emergency.room || emergency.location || 'Unknown'}. 
    Type: ${emergency.type}. 
    Context: A hospital emergency occurred.
    Task: Create a concise, urgent task title and description for a nurse/doctor. 
    Return strictly valid JSON in this format: {"title": "...", "description": "..."}
  `;
  
  try {
    let taskDetails = {
        title: `Emergency Response: ${emergency.type}`,
        description: `Immediate attention required in ${emergency.room || 'location'}.`
    };

    // Only attempt AI call if key is present
    const apiKey = (import.meta as any).env.VITE_OPENROUTER_KEY;
    
    if (apiKey) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "google/gemini-pro-1.5",
                    messages: [
                        { role: "system", content: "You are a hospital coordinator AI. Output strictly valid JSON." },
                        { role: "user", content: instruction }
                    ]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiContent = data.choices?.[0]?.message?.content;
                // Sanitize markdown code blocks if present
                const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
                taskDetails = JSON.parse(cleanJson);
            }
        } catch (aiError) {
            console.warn("AI Generation failed, using fallback details.", aiError);
        }
    }

    const assignedTo = await getBestStaff();

    if (assignedTo) {
        await supabase.from("tasks").insert({
            title: taskDetails.title,
            description: taskDetails.description,
            room: emergency.room || emergency.location || 'Unknown',
            priority: "High",
            assigned_to: assignedTo,
            status: "pending",
            created_at: new Date().toISOString(),
            // patient_id: emergency.patient_id 
        });
        console.log(`✅ Agent: Task assigned to ${assignedTo}`);
    } else {
        console.error("❌ Agent: No staff available for assignment.");
    }

  } catch (error) {
    console.error("❌ Agent Error:", error);
  }
}