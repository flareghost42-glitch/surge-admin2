
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmergencyIcon } from "./Icons";

// Base64 beep sound to avoid external asset dependencies
const ALERT_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 

export function EmergencyAlert() {
  const [emergency, setEmergency] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("emergency-alerts-ui")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emergencies" },
        (payload) => {
          console.log("🚨 Emergency Alert Received:", payload.new);
          setEmergency(payload.new);
          setIsVisible(true);
          
          // Play sound
          try {
            const audio = new Audio(ALERT_SOUND); 
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("Audio autoplay blocked", e));
          } catch (e) {
             // Ignore audio errors
          }

          // Auto dismiss after 30 seconds
          const timer = setTimeout(() => setIsVisible(false), 30000);
          return () => clearTimeout(timer);
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  if (!isVisible || !emergency) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] animate-pulse bg-red-600 text-white shadow-xl p-4 flex justify-between items-center border-b-4 border-red-800">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white/20 rounded-full">
            <EmergencyIcon className="w-8 h-8 text-white" />
        </div>
        <div>
            <h2 className="text-xl font-extrabold uppercase tracking-wider">
            Critical Emergency Alert
            </h2>
            <div className="flex gap-4 mt-1 text-sm font-medium text-red-100">
                <p>Type: <span className="text-white font-bold">{emergency.type}</span></p>
                <p>Room: <span className="text-white font-bold">{emergency.room || emergency.location || 'Unknown'}</span></p>
                <p>Staff ID: <span className="text-white font-bold">{emergency.triggered_by || 'System'}</span></p>
            </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button 
            onClick={() => setIsVisible(false)}
            className="bg-red-800 hover:bg-red-900 text-white px-6 py-2 rounded-lg font-bold transition-colors border border-red-500"
        >
            ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
}
