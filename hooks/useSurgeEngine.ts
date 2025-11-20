import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SurgeLevel, AlertType, AIRecommendation } from '../types';
import { SIMULATION_INTERVALS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const useSurgeEngine = () => {
  const { state, dispatch } = useAppContext();
  const stateRef = useRef(state);
  stateRef.current = state;

  const runSimulationLogic = () => {
    const currentState = stateRef.current;
    const avgRisk = currentState.forecast.reduce((acc, f) => acc + f.riskLevel, 0) / Math.max(1, currentState.forecast.length);
      
    let newCommentary = "National surge levels appear stable. Monitoring continues.";
    if (avgRisk > 0.7) newCommentary = "Critical surge risk detected in multiple regions. Immediate action may be required.";
    else if (avgRisk > 0.5) newCommentary = "High surge risk in several key areas. Hospital resources are being monitored closely.";
    else if (avgRisk > 0.3) newCommentary = "Moderate surge risk observed. Preparedness levels should be reviewed.";

    dispatch({ type: 'SET_FORECAST_COMMENTARY', payload: newCommentary });

    // Generate recommendations based on REAL data state
    const sampleRecommendations = [];
    
    const busyStaff = currentState.staff.filter(s => s.workload > 80).length;
    if (busyStaff > currentState.staff.length * 0.3) {
        sampleRecommendations.push({ text: "High workload detected on nursing staff. Consider calling in reserve staff.", priority: 'high', category: 'STAFF' });
    }
    
    const criticalSupplies = currentState.supplies.filter(s => s.level < s.criticalThreshold);
    if (criticalSupplies.length > 0) {
         sampleRecommendations.push({ text: `Critical shortage: ${criticalSupplies.map(s => s.name).join(', ')}. Initiate restocking.`, priority: 'high', category: 'SUPPLY' });
    }
    
    const occupiedBeds = currentState.beds.filter(b => b.status === 'Occupied').length;
    if (occupiedBeds > currentState.beds.length * 0.9) {
        sampleRecommendations.push({ text: "Bed occupancy critical (>90%). Expedite patient discharge.", priority: 'high', category: 'PATIENT_FLOW' });
    }

    if(sampleRecommendations.length === 0) {
        sampleRecommendations.push({ text: "Operations are running within normal parameters.", priority: 'low', category: 'OPERATIONS' });
    }

    const newRecommendations: AIRecommendation[] = sampleRecommendations.map(rec => ({
        id: uuidv4(),
        text: rec.text,
        priority: rec.priority as 'low' | 'medium' | 'high',
        category: rec.category as 'STAFF' | 'PATIENT_FLOW' | 'SUPPLY' | 'OPERATIONS' | 'GENERAL',
        createdAt: new Date(),
    }));
    dispatch({ type: 'SET_RECOMMENDATIONS', payload: newRecommendations });
  };

  // We now only calculate derived state based on incoming data, instead of generating fake data.
  useEffect(() => {
    const analysisInterval = setInterval(() => {
      const currentState = stateRef.current;
      
      // Recalculate Surge Level based on the current Forecast Data (which comes from DB now)
      const avgRisk = currentState.forecast.reduce((acc, f) => acc + f.riskLevel, 0) / Math.max(1, currentState.forecast.length);
      let newSurgeLevel = SurgeLevel.Normal;
      if (avgRisk > 0.7) newSurgeLevel = SurgeLevel.Critical;
      else if (avgRisk > 0.5) newSurgeLevel = SurgeLevel.High;
      else if (avgRisk > 0.3) newSurgeLevel = SurgeLevel.Moderate;
      
      if (newSurgeLevel !== currentState.surgeLevel) {
          dispatch({ type: 'UPDATE_SURGE_LEVEL', payload: newSurgeLevel });
          dispatch({ type: 'ADD_ALERT', payload: { id: uuidv4(), type: AlertType.Surge, severity: 'warning', message: `Surge level changed to ${newSurgeLevel} based on live forecast`, timestamp: new Date() }});
      }

      runSimulationLogic();

    }, SIMULATION_INTERVALS.SURGE_PREDICTION);

    return () => {
      clearInterval(analysisInterval);
    };
  }, [dispatch]); 
};

export default useSurgeEngine;