import { useMemo } from 'react';

import { createApiClient } from './api';
import { useAuth } from './auth';

export const useApi = () => {
  const { token, signOut } = useAuth();
  return useMemo(() => createApiClient(() => token, signOut), [signOut, token]);
};
