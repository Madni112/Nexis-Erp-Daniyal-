import { useAuth as useCoreAuth } from '../Context/Auth';

export const useAuth = () => {
  const core = useCoreAuth();
  return {
    ...core,
    user: core.currentUser || { name: core.userName || 'Admin' },
    can: (_permission?: string) => true
  };
};
