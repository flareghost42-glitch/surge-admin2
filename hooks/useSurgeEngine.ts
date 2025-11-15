import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SurgeLevel, EmergencySeverity, CCTVEventType, TaskStatus, AlertType, StaffStatus, AIRecommendation } from '../types';
import { WARDS, SIMULATION_INTERVALS, STAFF_NAMES } from '../constants';
import { v4 as uuidv4 } from 'uuid';

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
    // Surge Prediction Simulation
    const surgeInterval = setInterval(() => {
      const currentState = stateRef.current;
      const newRiskLevels = currentState.forecast.map(f => ({
          ...f,
          riskLevel: Math.min(1, Math.max(0, f.riskLevel + (Math.random() - 0.5) * 0.05)),
      }));
      
      const avgRisk = newRiskLevels.reduce((acc, f) => acc + f.riskLevel, 0) / newRiskLevels.length;
      
      let newCommentary = "National surge levels appear stable. Monitoring continues.";
      if (avgRisk > 0.7) newCommentary = "Critical surge risk detected in multiple regions. Immediate action may be required.";
      else if (avgRisk > 0.5) newCommentary = "High surge risk in several key areas. Hospital resources are being monitored closely.";
      else if (avgRisk > 0.3) newCommentary = "Moderate surge risk observed. Preparedness levels should be reviewed.";

      dispatch({ type: 'SET_FORECAST_COMMENTARY', payload: newCommentary });
      dispatch({ type: 'UPDATE_FORECAST', payload: newRiskLevels });

      let newSurgeLevel = SurgeLevel.Normal;
      if (avgRisk > 0.7) newSurgeLevel = SurgeLevel.Critical;
      else if (avgRisk > 0.5) newSurgeLevel = SurgeLevel.High;
      else if (avgRisk > 0.3) newSurgeLevel = SurgeLevel.Moderate;
      
      if (newSurgeLevel !== currentState.surgeLevel) {
          dispatch({ type: 'UPDATE_SURGE_LEVEL', payload: newSurgeLevel });
          dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.Surge, severity: 'warning', message: `Simulation predicts surge level change to ${newSurgeLevel}`, timestamp: new Date() }});
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
    
    // Recommendation Simulation
    const recommendationInterval = setInterval(() => {
        const sampleRecommendations = [
            { text: "High workload on nursing staff in ICU. Consider re-allocating staff from General Ward.", priority: 'high', category: 'STAFF' },
            { text: "Bed occupancy nearing critical levels. Expedite patient discharge processes.", priority: 'high', category: 'PATIENT_FLOW' },
            { text: "Oxygen supplies are below the 30% threshold. Initiate restocking procedure immediately.", priority: 'high', category: 'SUPPLY' },
            { text: "Multiple IoT device alerts from Cardiology ward. Dispatch a technician to check equipment.", priority: 'medium', category: 'OPERATIONS' },
            { text: "Review patient-to-staff ratios in the Emergency department due to increased inflow.", priority: 'medium', category: 'STAFF' },
            { text: "Surgical gloves supply at 45%. Consider placing a new order soon.", priority: 'low', category: 'SUPPLY' }
        ];

        // Shuffle array and pick first 3
        const shuffled = sampleRecommendations.sort(() => 0.5 - Math.random());
        const newRecommendations: AIRecommendation[] = shuffled.slice(0, 3).map(rec => ({
            id: uuidv4(),
            text: rec.text,
            priority: rec.priority as 'low' | 'medium' | 'high',
            category: rec.category as 'STAFF' | 'PATIENT_FLOW' | 'SUPPLY' | 'OPERATIONS' | 'GENERAL',
            createdAt: new Date(),
        }));

        dispatch({ type: 'SET_RECOMMENDATIONS', payload: newRecommendations });
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