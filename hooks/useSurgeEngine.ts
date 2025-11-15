import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SurgeLevel, EmergencySeverity, CCTVEventType, TaskStatus, AlertType, StaffStatus } from '../types';
import { WARDS, SIMULATION_INTERVALS, STAFF_NAMES } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const useSurgeEngine = () => {
  const { state, dispatch } = useAppContext();
  const { beds, staff, surgeLevel, emergencies, supplies, tasks } = state;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Master Tick for continuous, small updates
  useEffect(() => {
    const masterTick = setInterval(() => {
      // Simulate Staff Workload & Status
      const updatedStaff = stateRef.current.staff.map(s => {
        let newWorkload = s.workload + (Math.random() - 0.5) * 5;
        newWorkload = Math.max(0, Math.min(100, newWorkload));
        let newStatus = s.status;
        if (newWorkload > 85 && s.status === StaffStatus.Active) newStatus = StaffStatus.Busy;
        else if (newWorkload < 50 && s.status === StaffStatus.Busy) newStatus = StaffStatus.Active;
        return { ...s, workload: newWorkload, status: newStatus };
      });
      dispatch({ type: 'UPDATE_STAFF', payload: updatedStaff });

      // Simulate Supply Depletion
      const updatedSupplies = stateRef.current.supplies.map(sup => {
        const usage = (Math.random() * 0.2);
        const newLevel = Math.max(0, sup.level - usage);
        return { ...sup, level: parseFloat(newLevel.toFixed(2)) };
      });
      dispatch({ type: 'UPDATE_SUPPLIES', payload: updatedSupplies });
      
    }, SIMULATION_INTERVALS.GLOBAL_TICK);
    
    return () => clearInterval(masterTick);
  }, [dispatch]);

  useEffect(() => {
    // AI-Powered Surge Prediction Simulation
    const surgeInterval = setInterval(async () => {
      const currentState = stateRef.current;
       // 1. Collect current hospital metrics
      const occupiedBeds = currentState.beds.filter(b => b.status === 'Occupied').length;
      const occupancyRate = occupiedBeds / currentState.beds.length;
      const criticalEmergencies = currentState.emergencies.filter(e => e.severity === EmergencySeverity.Critical).length;
      const highWorkloadStaff = currentState.staff.filter(s => s.workload > 80).length;
      const recentInflow = currentState.patientInflow.slice(-5).reduce((acc, item) => acc + item.count, 0);

      const prompt = `
        Act as a public health data scientist running a national-level pandemic simulation. Your task is to generate a JSON object representing the predicted COVID-19 surge risk for all states and union territories of India for the next 24 hours, PLUS a brief, insightful commentary on the overall situation.

        You are receiving data from a key hospital. Use this data as a bellwether indicator for the national trend.

        Current Key Hospital Data:
        - Overall Surge Level Alert: ${currentState.surgeLevel}
        - Bed Occupancy: ${(occupancyRate * 100).toFixed(1)}%
        - Recent Patient Inflow Trend: ${recentInflow} new patients in the last 10 hours.
        - Active Critical Emergencies: ${criticalEmergencies}
        - Staff under High Workload (>80%): ${highWorkloadStaff} out of ${currentState.staff.length}

        Based on this data, generate a plausible, dynamic forecast. Ensure some regions show elevated risk to create a realistic scenario for the dashboard.
        
        Also provide a 1-2 sentence commentary explaining the key drivers for the current forecast (e.g., "High patient inflow and critical occupancy at the bellwether hospital suggest an upward trend in major urban centers, particularly in the western regions. Proactive measures are advised.").

        Your output MUST be a JSON object that adheres to the provided schema.
      `;
            
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
              commentary: {
                  type: Type.STRING,
                  description: "A brief, insightful analysis of the surge forecast based on the provided hospital data."
              },
              forecasts: {
                  type: Type.ARRAY,
                  description: "An array of surge risk predictions for each Indian state and territory.",
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          region: { type: Type.STRING, description: "The name of the Indian state or union territory." },
                          riskLevel: { type: Type.NUMBER, description: "A numerical risk value between 0.0 and 1.0." }
                      },
                      required: ["region", "riskLevel"]
                  }
              }
          },
          required: ["commentary", "forecasts"]
      };

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
          }
        });

        const jsonResponse = JSON.parse(response.text);
        const newRiskLevels = jsonResponse.forecasts;
        const newCommentary = jsonResponse.commentary;

        if (newCommentary) {
            dispatch({ type: 'SET_FORECAST_COMMENTARY', payload: newCommentary });
        }

        if (Array.isArray(newRiskLevels) && newRiskLevels.length > 0) {
            dispatch({ type: 'UPDATE_FORECAST', payload: newRiskLevels });

            const avgRisk = newRiskLevels.reduce((acc, f) => acc + f.riskLevel, 0) / newRiskLevels.length;
            let newSurgeLevel = SurgeLevel.Normal;
            if (avgRisk > 0.7) newSurgeLevel = SurgeLevel.Critical;
            else if (avgRisk > 0.5) newSurgeLevel = SurgeLevel.High;
            else if (avgRisk > 0.3) newSurgeLevel = SurgeLevel.Moderate;
            
            if (newSurgeLevel !== currentState.surgeLevel) {
                dispatch({ type: 'UPDATE_SURGE_LEVEL', payload: newSurgeLevel });
                dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.Surge, severity: 'warning', message: `AI predicts surge level change to ${newSurgeLevel}`, timestamp: new Date() }});
            }
        }
      } catch (error) {
          console.error("AI Surge Prediction Error:", error);
          // Fallback to random simulation if AI fails
          const fallbackRiskLevels = currentState.forecast.map(f => ({
              ...f,
              riskLevel: Math.min(1, Math.max(0, f.riskLevel + (Math.random() - 0.5) * 0.05)),
          }));
          dispatch({ type: 'UPDATE_FORECAST', payload: fallbackRiskLevels });
      }
    }, SIMULATION_INTERVALS.SURGE_PREDICTION);

    // New Patient Inflow Simulation
    const inflowInterval = setInterval(() => {
        const now = new Date();
        const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
        const newPatients = Math.floor(Math.random() * (stateRef.current.surgeLevel === SurgeLevel.Critical ? 10 : 5));
        dispatch({ type: 'UPDATE_PATIENT_INFLOW', payload: { time, count: newPatients } });
    }, SIMULATION_INTERVALS.PATIENT_INFLOW);

    // Emergency Simulation
    const emergencyInterval = setInterval(() => {
        if (Math.random() < 0.3) return; // Not every time
        const emergencyTypes = ["Cardiac Arrest", "Stroke", "Trauma", "Respiratory Failure"];
        const severities = Object.values(EmergencySeverity);
        dispatch({
            type: 'ADD_EMERGENCY',
            payload: { id: uuidv4(), type: emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)], location: `Ward ${WARDS[Math.floor(Math.random() * WARDS.length)]}`, severity: severities[Math.floor(Math.random() * severities.length)], timestamp: new Date(), details: "Patient requires immediate attention.", assignedStaff: [] }
        });
    }, SIMULATION_INTERVALS.EMERGENCY);

    // IoT Readings Simulation
    const iotInterval = setInterval(() => {
      stateRef.current.iotDevices.forEach(device => {
        let newValue = device.lastReading;
        let isAbnormal = false;
        let alertMessage = '';

        if (device.type === 'HeartRate') {
          newValue += (Math.random() - 0.5) * 3;
          if (Math.random() < 0.05) { newValue = Math.random() > 0.5 ? 140 : 40; } // Abnormal spike
          newValue = Math.max(30, Math.min(180, newValue));
          isAbnormal = newValue > 120 || newValue < 50;
        }
        if (device.type === 'Oxygen') {
          newValue += (Math.random() - 0.5) * 0.5;
          if (Math.random() < 0.05) { newValue = 88; } // Abnormal drop
          newValue = Math.max(85, Math.min(100, newValue));
          isAbnormal = newValue < 92;
        }
        if (device.type === 'Temperature') {
          newValue += (Math.random() - 0.5) * 0.2;
          if (Math.random() < 0.05) { newValue = 103; } // Abnormal spike (fever)
          newValue = Math.max(96, Math.min(104, newValue));
          isAbnormal = newValue > 100.4 || newValue < 97;
        }
        if (device.type === 'BPSystolic') {
          newValue += (Math.random() - 0.5) * 4;
          if (Math.random() < 0.05) { newValue = 170; } // Abnormal spike
          newValue = Math.max(90, Math.min(180, newValue));
          isAbnormal = newValue > 140 || newValue < 110;
        }

        dispatch({ type: 'ADD_IOT_READING', payload: { deviceId: device.id, value: parseFloat(newValue.toFixed(1)), timestamp: new Date() }});
        
        if (isAbnormal) {
          alertMessage = `Abnormal ${device.type}: ${newValue.toFixed(1)}${device.unit} for Patient #${device.patientId.slice(-4)}`;
          dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.IoT, severity: 'critical', message: alertMessage, timestamp: new Date() }});
        }
        
        // Simulate device status changes
        if(Math.random() < 0.01) {
            const newStatus = device.status === 'online' ? 'offline' : 'online';
            dispatch({ type: 'UPDATE_IOT_STATUS', payload: { deviceId: device.id, status: newStatus } });
        }
      });
    }, SIMULATION_INTERVALS.IOT_READING);
    
    // CCTV Event Simulation
    const cctvInterval = setInterval(() => {
      if (Math.random() < 0.5) return;
      const eventTypes = Object.values(CCTVEventType);
      let type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const locations = [
          ...WARDS.map(w => `${w} Hallway`),
          "Waiting Room",
          "Hospital Entry",
      ];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const cameraId = `CAM-${Math.floor(Math.random() * 10) + 1}`;
      
      let detectionData;
      // Force person detection for main feeds occasionally
      if (['Waiting Room', 'Hospital Entry'].includes(location) && Math.random() > 0.3) {
          type = CCTVEventType.PersonDetected;
      }

      if (type === CCTVEventType.PersonDetected) {
          const numDetections = Math.floor(Math.random() * 5) + 1; // 1 to 5 people
          detectionData = Array.from({ length: numDetections }).map(() => ({
              box: [
                  Math.random() * 70, // x (0-70%)
                  Math.random() * 50, // y (0-50%)
                  20 + Math.random() * 10, // width (20-30%)
                  40 + Math.random() * 10, // height (40-50%)
              ] as [number, number, number, number]
          }));
      }
      
      dispatch({
        type: 'ADD_CCTV_EVENT',
        payload: { id: uuidv4(), cameraId, location, type, timestamp: new Date(), clipUrl: '#', riskScore: Math.random(), detectionData }
      });
      
      // Don't create a separate alert for every person detection to avoid spam, only for more critical events.
      if (type !== CCTVEventType.PersonDetected) {
          dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.CCTV, severity: 'warning', message: `${type} detected at ${location}`, timestamp: new Date() }});
      }
    }, SIMULATION_INTERVALS.CCTV_EVENT);
    
    // AI Recommendation Simulation
    const recommendationInterval = setInterval(async () => {
        const currentState = stateRef.current;
        const occupiedBeds = currentState.beds.filter(b => b.status === 'Occupied').length;
        const occupancyRate = occupiedBeds / currentState.beds.length;
        const criticalEmergencies = currentState.emergencies.filter(e => e.severity === EmergencySeverity.Critical).length;
        const highWorkloadStaff = currentState.staff.filter(s => s.workload > 80).length;
        const recentInflow = currentState.patientInflow.slice(-5).reduce((acc, item) => acc + item.count, 0);
        const lowSupplies = currentState.supplies.filter(s => s.level < s.criticalThreshold).map(s => s.name);

        const prompt = `
            Act as an AI operations analyst for a hospital. Based on the following real-time data, generate a JSON object containing 2-3 brief, actionable recommendations to improve hospital efficiency and patient care.

            Current Hospital Status:
            - Overall Surge Level: ${currentState.surgeLevel}
            - Bed Occupancy: ${(occupancyRate * 100).toFixed(1)}%
            - Recent Patient Inflow: ${recentInflow} patients in the last 10 hours.
            - Active Critical Emergencies: ${criticalEmergencies}
            - Staff with High Workload (>80%): ${highWorkloadStaff} out of ${currentState.staff.length}
            - Supplies running low: ${lowSupplies.join(', ') || 'None'}

            For each recommendation, provide:
            1. 'text': The recommendation itself (e.g., "Divert incoming non-critical patients to Ward B due to high ICU occupancy.").
            2. 'priority': 'high', 'medium', or 'low'.
            3. 'category': One of 'STAFF', 'PATIENT_FLOW', 'SUPPLY', 'OPERATIONS'.

            Your output MUST be a JSON object conforming to the provided schema.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                recommendations: {
                    type: Type.ARRAY,
                    description: "An array of 2-3 operational recommendations.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING, description: "The actionable recommendation." },
                            priority: { type: Type.STRING, description: "Priority level: high, medium, or low." },
                            category: { type: Type.STRING, description: "Category: STAFF, PATIENT_FLOW, SUPPLY, or OPERATIONS." }
                        },
                        required: ["text", "priority", "category"]
                    }
                }
            },
            required: ["recommendations"]
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                }
            });

            const jsonResponse = JSON.parse(response.text);
            const newRecommendations = jsonResponse.recommendations.map((rec: any) => ({
                id: uuidv4(),
                text: rec.text,
                priority: rec.priority,
                category: rec.category || 'GENERAL',
                createdAt: new Date(),
            }));

            if (Array.isArray(newRecommendations)) {
                dispatch({ type: 'SET_RECOMMENDations', payload: newRecommendations });
            }
        } catch (error) {
            console.error("AI Recommendation Error:", error);
        }
    }, SIMULATION_INTERVALS.RECOMMENDATION);

    // New Task Simulation
    const taskInterval = setInterval(() => {
        const titles = ["Administer Medication", "Check Patient Vitals", "Update Patient Chart", "Prepare for Discharge"];
        const assignedStaff = STAFF_NAMES[Math.floor(Math.random() * STAFF_NAMES.length)];
        dispatch({
            type: 'ADD_TASK',
            payload: { id: uuidv4(), title: titles[Math.floor(Math.random() * titles.length)], description: "Complete as per protocol.", status: TaskStatus.Pending, assignedTo: assignedStaff, createdAt: new Date(), priority: 'Medium' }
        });
    }, SIMULATION_INTERVALS.NEW_TASK);

    return () => {
      clearInterval(surgeInterval);
      clearInterval(inflowInterval);
      clearInterval(emergencyInterval);
      clearInterval(iotInterval);
      clearInterval(cctvInterval);
      clearInterval(recommendationInterval);
      clearInterval(taskInterval);
    };
  }, [dispatch]); 
};

export default useSurgeEngine;