import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SurgeLevel, EmergencySeverity, CCTVEventType, TaskStatus, AlertType, StaffStatus, AIRecommendation, BedStatus } from '../types';
import { WARDS, SIMULATION_INTERVALS, STAFF_NAMES } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from '@google/genai';

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

  const runAgenticAnalysis = async () => {
    const currentState = stateRef.current;
    if (!currentState.agenticAiEnabled || !process.env.API_KEY) {
        runSimulationFallback();
        return;
    }

    const occupiedBeds = currentState.beds.filter(b => b.status === BedStatus.Occupied).length;
    const bedOccupancy = (occupiedBeds / currentState.beds.length) * 100;
    const avgWorkload = currentState.staff.reduce((acc, s) => acc + s.workload, 0) / currentState.staff.length;
    const criticalEmergencies = currentState.emergencies.filter(e => e.severity === EmergencySeverity.Critical).length;
    const criticalSupplies = currentState.supplies.filter(s => s.level < s.criticalThreshold).map(s => `${s.name}: ${s.level.toFixed(0)}%`);
    const highRiskRegions = currentState.forecast.filter(f => f.riskLevel > 0.6).map(f => f.region);
    
    const contextData = {
        "hospitalSurgeLevel": currentState.surgeLevel,
        "bedOccupancy": `${bedOccupancy.toFixed(1)}%`,
        "averageStaffWorkload": `${avgWorkload.toFixed(1)}%`,
        "criticalEmergencies": criticalEmergencies,
        "criticalSupplyLevels": criticalSupplies,
        "pendingTasks": currentState.tasks.length,
        "nationalSurgeForecast": {
           "averageRisk": `${(currentState.forecast.reduce((acc, f) => acc + f.riskLevel, 0) / currentState.forecast.length * 100).toFixed(1)}%`,
           "highRiskRegions": highRiskRegions
        }
    };
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const schema = {
            type: Type.OBJECT,
            properties: {
                forecastCommentary: {
                    type: Type.STRING,
                    description: "A 1-2 sentence analysis of the national surge risk."
                },
                recommendations: {
                    type: Type.ARRAY,
                    description: "An array of exactly 3 actionable, prioritized recommendations.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING, description: "The recommendation text." },
                            priority: { type: Type.STRING, description: "Priority: 'low', 'medium', or 'high'." },
                            category: { type: Type.STRING, description: "Category: 'STAFF', 'PATIENT_FLOW', 'SUPPLY', 'OPERATIONS', or 'GENERAL'." },
                        }
                    }
                }
            }
        };

        const systemInstruction = `You are 'SurgeMind', an advanced AI operations agent for a hospital. Your goal is to analyze real-time data and provide actionable insights to the hospital administrator. Based on the provided JSON data, return a JSON object that strictly adheres to the provided schema. Be concise, professional, and data-driven.`;
        const userPrompt = `Analyze the following hospital status data: ${JSON.stringify(contextData)}`;

        const response = await ai.models.generateContent({
            model: currentState.llmModel,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const content = JSON.parse(response.text);

        if (content.forecastCommentary) {
            dispatch({ type: 'SET_FORECAST_COMMENTARY', payload: content.forecastCommentary });
        }
        if (content.recommendations && Array.isArray(content.recommendations)) {
            const newRecommendations: AIRecommendation[] = content.recommendations.slice(0, 3).map((rec: any) => ({
                id: uuidv4(),
                text: rec.text || "Invalid recommendation format",
                priority: rec.priority || 'medium',
                category: rec.category || 'GENERAL',
                createdAt: new Date(),
            }));
            dispatch({ type: 'SET_RECOMMENDATIONS', payload: newRecommendations });
        }

    } catch (error) {
        console.error("Failed to generate content with Gemini:", error);
        dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.Emergency, severity: 'critical', message: `AI Agent Error: Failed to retrieve analysis.`, timestamp: new Date() }});
        runSimulationFallback();
    }
  };

  const runSimulationFallback = () => {
    const currentState = stateRef.current;
    const avgRisk = currentState.forecast.reduce((acc, f) => acc + f.riskLevel, 0) / currentState.forecast.length;
      
    let newCommentary = "National surge levels appear stable. Monitoring continues.";
    if (avgRisk > 0.7) newCommentary = "Critical surge risk detected in multiple regions. Immediate action may be required.";
    else if (avgRisk > 0.5) newCommentary = "High surge risk in several key areas. Hospital resources are being monitored closely.";
    else if (avgRisk > 0.3) newCommentary = "Moderate surge risk observed. Preparedness levels should be reviewed.";

    dispatch({ type: 'SET_FORECAST_COMMENTARY', payload: newCommentary });

    const sampleRecommendations = [
        { text: "High workload on nursing staff in ICU. Consider re-allocating staff from General Ward.", priority: 'high', category: 'STAFF' },
        { text: "Bed occupancy nearing critical levels. Expedite patient discharge processes.", priority: 'high', category: 'PATIENT_FLOW' },
        { text: "Oxygen supplies are below the 30% threshold. Initiate restocking procedure immediately.", priority: 'high', category: 'SUPPLY' },
    ];
    const newRecommendations: AIRecommendation[] = sampleRecommendations.map(rec => ({
        id: uuidv4(),
        text: rec.text,
        priority: rec.priority as 'low' | 'medium' | 'high',
        category: rec.category as 'STAFF' | 'PATIENT_FLOW' | 'SUPPLY' | 'OPERATIONS' | 'GENERAL',
        createdAt: new Date(),
    }));
    dispatch({ type: 'SET_RECOMMENDATIONS', payload: newRecommendations });
  };


  useEffect(() => {
    // Surge Prediction & Agentic AI Interval
    const agentInterval = setInterval(() => {
      const currentState = stateRef.current;
      const newRiskLevels = currentState.forecast.map(f => ({
          ...f,
          riskLevel: Math.min(1, Math.max(0, f.riskLevel + (Math.random() - 0.5) * 0.05)),
      }));
      
      dispatch({ type: 'UPDATE_FORECAST', payload: newRiskLevels });
      
      const avgRisk = newRiskLevels.reduce((acc, f) => acc + f.riskLevel, 0) / newRiskLevels.length;
      let newSurgeLevel = SurgeLevel.Normal;
      if (avgRisk > 0.7) newSurgeLevel = SurgeLevel.Critical;
      else if (avgRisk > 0.5) newSurgeLevel = SurgeLevel.High;
      else if (avgRisk > 0.3) newSurgeLevel = SurgeLevel.Moderate;
      
      if (newSurgeLevel !== currentState.surgeLevel) {
          dispatch({ type: 'UPDATE_SURGE_LEVEL', payload: newSurgeLevel });
          dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.Surge, severity: 'warning', message: `Simulation predicts surge level change to ${newSurgeLevel}`, timestamp: new Date() }});
      }

      runAgenticAnalysis();

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
      
      if (type !== CCTVEventType.PersonDetected) {
          dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.CCTV, severity: 'warning', message: `${type} detected at ${location}`, timestamp: new Date() }});
      }
    }, SIMULATION_INTERVALS.CCTV_EVENT);

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
      clearInterval(agentInterval);
      clearInterval(inflowInterval);
      clearInterval(emergencyInterval);
      clearInterval(iotInterval);
      clearInterval(cctvInterval);
      clearInterval(taskInterval);
    };
  }, [dispatch]); 
};

export default useSurgeEngine;