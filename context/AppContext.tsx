import React, { createContext, useReducer, useContext, Dispatch, useEffect } from 'react';
import { 
  Patient, StaffMember, Task, Appointment, Emergency, Bed, 
  ForecastData, Supply, CCTVEvent, IoTDevice, IoTReading, AIRecommendation, SurgeLevel, Alert 
} from '../types';
import { INDIA_STATES } from '../constants';
import { 
    getPatients, getStaffStatus, getTasks, getEmergencies, getBeds, getSupplies, 
    getSurgePredictions, getIoTDevices, getCCTVEvents,
    subscribeToEmergencies, subscribeToTasks, subscribeToIoTReadings, subscribeToCCTV,
    subscribeToSupplies, subscribeToSurgePredictions
} from '../services/adminService';

export type Pages = 'dashboard' | 'forecast' | 'cctvMonitoring' | 'iotMonitoring' | 'emergency' | 'staff' | 'patients' | 'tasks' | 'appointments' | 'supplies' | 'beds' | 'settings';

interface AppState {
  patients: Patient[];
  staff: StaffMember[];
  tasks: Task[];
  appointments: Appointment[];
  emergencies: Emergency[];
  beds: Bed[];
  forecast: ForecastData[];
  forecastCommentary: string;
  supplies: Supply[];
  cctvEvents: CCTVEvent[];
  iotDevices: IoTDevice[];
  iotReadings: { [deviceId: string]: IoTReading[] };
  aiRecommendations: AIRecommendation[];
  alerts: Alert[];
  surgeLevel: SurgeLevel;
  patientInflow: { time: string; count: number }[];
  theme: 'dark' | 'light';
  isLoading: boolean;
}

type AppAction = 
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'ADD_EMERGENCY'; payload: Emergency }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'ADD_CCTV_EVENT'; payload: CCTVEvent }
  | { type: 'ADD_IOT_READING'; payload: IoTReading }
  | { type: 'UPDATE_FORECAST'; payload: ForecastData[] }
  | { type: 'SET_FORECAST_COMMENTARY'; payload: string }
  | { type: 'UPDATE_PATIENT_INFLOW'; payload: { time: string; count: number } }
  | { type: 'ADD_RECOMMENDATION'; payload: AIRecommendation }
  | { type: 'SET_RECOMMENDATIONS'; payload: AIRecommendation[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'UPDATE_BEDS'; payload: Bed[] }
  | { type: 'UPDATE_SUPPLIES'; payload: Supply[] }
  | { type: 'UPDATE_STAFF'; payload: StaffMember[] }
  | { type: 'UPDATE_IOT_STATUS'; payload: { deviceId: string; status: 'online' | 'offline' | 'error' } }
  | { type: 'UPDATE_SURGE_LEVEL'; payload: SurgeLevel }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  patients: [],
  staff: [],
  tasks: [],
  appointments: [],
  emergencies: [],
  beds: [],
  forecast: INDIA_STATES.map(state => ({ region: state, riskLevel: 0 })),
  forecastCommentary: "Initializing system data...",
  supplies: [],
  cctvEvents: [],
  iotDevices: [],
  iotReadings: {},
  aiRecommendations: [],
  alerts: [],
  surgeLevel: SurgeLevel.Normal,
  patientInflow: [],
  theme: 'dark',
  isLoading: true,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
    case 'ADD_PATIENT':
      return { ...state, patients: [...state.patients, action.payload] };
    case 'ADD_EMERGENCY':
      return { ...state, emergencies: [action.payload, ...state.emergencies].slice(0, 50) };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks].slice(0, 50) };
    case 'ADD_CCTV_EVENT':
      return { ...state, cctvEvents: [action.payload, ...state.cctvEvents].slice(0, 50) };
    case 'ADD_IOT_READING': {
      const { deviceId } = action.payload;
      const readings = state.iotReadings[deviceId] || [];
      const newReadings = [...readings, action.payload].slice(-50);
      const updatedDevices = state.iotDevices.map(d => d.id === deviceId ? { ...d, lastReading: action.payload.value } : d);
      return {
        ...state,
        iotDevices: updatedDevices,
        iotReadings: { ...state.iotReadings, [deviceId]: newReadings },
      };
    }
    case 'UPDATE_FORECAST':
      return { ...state, forecast: action.payload };
    case 'SET_FORECAST_COMMENTARY':
        return { ...state, forecastCommentary: action.payload };
    case 'UPDATE_PATIENT_INFLOW': {
      const newInflow = [...state.patientInflow.slice(1), action.payload];
      return { ...state, patientInflow: newInflow };
    }
    case 'ADD_RECOMMENDATION': {
        const newRecommendations = [action.payload, ...state.aiRecommendations];
        return { ...state, aiRecommendations: newRecommendations.slice(0, 5) };
    }
    case 'SET_RECOMMENDATIONS':
        return { ...state, aiRecommendations: action.payload };
    case 'ADD_ALERT': {
        const newAlerts = [action.payload, ...state.alerts];
        return { ...state, alerts: newAlerts.slice(0, 10) };
    }
    case 'UPDATE_BEDS':
        return { ...state, beds: action.payload };
    case 'UPDATE_SUPPLIES':
        return { ...state, supplies: action.payload };
    case 'UPDATE_STAFF':
        return { ...state, staff: action.payload };
    case 'UPDATE_IOT_STATUS': {
        const updatedDevices = state.iotDevices.map(d => 
            d.id === action.payload.deviceId ? { ...d, status: action.payload.status } : d
        );
        return { ...state, iotDevices: updatedDevices };
    }
    case 'UPDATE_SURGE_LEVEL':
        return { ...state, surgeLevel: action.payload };
    case 'TOGGLE_THEME': {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { ...state, theme: newTheme };
    }
    default:
      return state;
  }
};

interface AppContextProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextProps>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const fetchData = async () => {
        try {
            const [
                patients, staff, tasks, emergencies, supplies, 
                beds, forecast, iotDevices, cctvEvents
            ] = await Promise.all([
                getPatients(), getStaffStatus(), getTasks(), getEmergencies(),
                getSupplies(), getBeds(), getSurgePredictions(),
                getIoTDevices(), getCCTVEvents()
            ]);

            dispatch({ 
                type: 'SET_STATE', 
                payload: { 
                    patients, staff, tasks, emergencies, supplies, 
                    beds, forecast: forecast.length > 0 ? forecast : state.forecast, 
                    iotDevices, cctvEvents, isLoading: false
                } 
            });
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Real-time subscriptions
    const subs = [
        subscribeToEmergencies((e) => dispatch({ type: 'ADD_EMERGENCY', payload: e })),
        subscribeToTasks((t) => dispatch({ type: 'ADD_TASK', payload: t })),
        subscribeToIoTReadings((r) => dispatch({ type: 'ADD_IOT_READING', payload: r })),
        subscribeToCCTV((e) => dispatch({ type: 'ADD_CCTV_EVENT', payload: e })),
        subscribeToSupplies((s) => dispatch({ type: 'UPDATE_SUPPLIES', payload: s })),
        subscribeToSurgePredictions((f) => dispatch({ type: 'UPDATE_FORECAST', payload: f }))
    ];

    return () => {
        subs.forEach(sub => sub.unsubscribe());
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);