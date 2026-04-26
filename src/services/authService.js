import { jsonStore } from './jsonStore';

export const authService = {
  login: (email, password) => jsonStore.loginUser(email, password),
  register: (userData) => jsonStore.registerUser(userData),
  logout: () => jsonStore.logoutUser(),
  getCurrentUser: () => jsonStore.getCurrentUser(),
};
