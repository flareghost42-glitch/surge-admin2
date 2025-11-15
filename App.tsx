
import React, { useState, useMemo } from 'react';
import { AppProvider, Pages } from './context/AppContext';
import useSurgeEngine from './hooks/useSurgeEngine';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import CCTVMonitoring from './pages/CCTVMonitoring';
import IoTMonitoring from './pages/IoTMonitoring';
import Emergency from './pages/Emergency';
import Staff from './pages/Staff';
import Patients from './pages/Patients';
import Tasks from './pages/Tasks';
import Appointments from './pages/Appointments';
import Supplies from './pages/Supplies';
import Beds from './pages/Beds';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Pages>('dashboard');

  const PageComponent = useMemo(() => {
    switch (activePage) {
      case 'dashboard': return Dashboard;
      case 'forecast': return Forecast;
      case 'cctvMonitoring': return CCTVMonitoring;
      case 'iotMonitoring': return IoTMonitoring;
      case 'emergency': return Emergency;
      case 'staff': return Staff;
      case 'patients': return Patients;
      case 'tasks': return Tasks;
      case 'appointments': return Appointments;
      case 'supplies': return Supplies;
      case 'beds': return Beds;
      case 'settings': return Settings;
      default: return Dashboard;
    }
  }, [activePage]);

  const SurgeEngineWrapper: React.FC = () => {
    useSurgeEngine();
    return null;
  };

  return (
    <AppProvider>
      <SurgeEngineWrapper />
      <Layout activePage={activePage} setActivePage={setActivePage}>
        <PageComponent />
      </Layout>
    </AppProvider>
  );
};

export default App;
