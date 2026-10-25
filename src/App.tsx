import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { SceneShell } from './app/SceneShell';
import { loadSave } from './data/save';
import { HomePage } from './pages/HomePage';
import { BattlePage } from './pages/BattlePage';
import { GachaPage } from './pages/GachaPage';
import { CollectionPage } from './pages/CollectionPage';
import { DeckPage } from './pages/DeckPage';
import { AwakenPage } from './pages/AwakenPage';
import { TutorialPage } from './pages/TutorialPage';

function RequireTutorial() {
  const save = loadSave();
  if (!save.initiated) return <Navigate to="/awaken" replace />;
  if (!save.tutorialDone) return <Navigate to="/tutorial" replace />;
  return <Outlet />;
}

function AwakenRoute() {
  if (loadSave().initiated) return <Navigate to="/" replace />;
  return <AwakenPage />;
}

function TutorialRoute() {
  const save = loadSave();
  if (!save.initiated) return <Navigate to="/awaken" replace />;
  if (save.tutorialDone) return <Navigate to="/" replace />;
  return <TutorialPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/awaken" element={<AwakenRoute />} />
      <Route path="/tutorial" element={<TutorialRoute />} />
      <Route element={<RequireTutorial />}>
        <Route element={<SceneShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/gacha" element={<GachaPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/deck" element={<DeckPage />} />
        </Route>
        <Route path="/battle" element={<BattlePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
