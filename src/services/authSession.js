import AsyncStorage from '@react-native-async-storage/async-storage';

import { navigationRef } from '../navigation/navigationService';
import useUserStore from '../store/userStore';

export async function logoutAndRedirectToLogin(navigation) {
  await AsyncStorage.multiRemove(['access_token', 'user_data']);

  const clearAuthData = useUserStore.getState().clearAuthData;
  if (typeof clearAuthData === 'function') {
    clearAuthData();
  }

  const resetState = {
    index: 0,
    routes: [{ name: 'Login' }],
  };

  if (navigationRef.isReady()) {
    navigationRef.resetRoot(resetState);
    return;
  }

  let rootNavigation = navigation;
  while (rootNavigation?.getParent?.()) {
    rootNavigation = rootNavigation.getParent();
  }

  if (rootNavigation?.reset) {
    rootNavigation.reset(resetState);
    return;
  }

  if (rootNavigation?.navigate) {
    rootNavigation.navigate('Login');
  }
}
