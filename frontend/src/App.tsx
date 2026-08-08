import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './auth';
import { Layout } from './components/Layout';
import { UnlockPage } from './pages/UnlockPage';
import { StoragePage } from './pages/StoragePage';
import { InventoryPage } from './pages/InventoryPage';
import { SupplyFormPage } from './pages/SupplyFormPage';

const AuthenticatedRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<InventoryPage mode="primary" />} />
      <Route path="/backup" element={<InventoryPage mode="backup" />} />
      <Route
        path="/out-of-stock"
        element={<InventoryPage mode="outOfStock" />}
      />
      <Route path="/storage" element={<StoragePage />} />
      <Route path="/supplies/new" element={<SupplyFormPage />} />
      <Route path="/supplies/:supplyId/edit" element={<SupplyFormPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

const App = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedRoutes /> : <UnlockPage />;
};

export default App;
