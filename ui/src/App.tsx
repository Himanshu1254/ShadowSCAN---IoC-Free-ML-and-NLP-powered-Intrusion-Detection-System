import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Flows from './pages/Flows';
import Sessions from './pages/Sessions';
import Intelligence from './pages/Intelligence';
import Ingestion from './pages/Ingestion';
import AlertOverview from './pages/AlertOverview';
import HIDS from './pages/HIDS';
import SystemHealth from './pages/SystemHealth';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="flows" element={<Flows />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="intelligence" element={<Intelligence />} />
        <Route path="ingestion" element={<Ingestion />} />
        <Route path="alert/:id" element={<AlertOverview />} />
        <Route path="hids" element={<HIDS />} />
        <Route path="health" element={<SystemHealth />} />
      </Route>
    </Routes>
  );
};

export default App;
