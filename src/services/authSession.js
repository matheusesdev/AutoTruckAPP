import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

import { navigationRef } from '../navigation/navigationService';
import useUserStore from '../store/userStore';

export async function logoutAndRedirectToLogin(navigation) {
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('user_data');

  const clearAuthData = useUserStore.getState().clearAuthData;
  if (typeof clearAuthData === 'function') {
    clearAuthData();
  }

  const resetAction = CommonActions.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });

  if (navigation?.dispatch) {
    navigation.dispatch(resetAction);
    return;
  }

  if (navigationRef.isReady()) {
    navigationRef.dispatch(resetAction);
  }
}
