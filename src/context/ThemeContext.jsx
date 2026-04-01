import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../utils/db';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState('dark'); // 'dark', 'blue', 'green', 'purple'

  useEffect(() => {
    // Load theme from localStorage first so it applies immediately
    const localTheme = localStorage.getItem('app-theme') || 'dark';
    setTheme(localTheme);
    document.documentElement.setAttribute('data-theme', localTheme);

    // Then try to fetch from Firebase
    if (currentUser) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile && profile.theme && profile.theme !== localTheme) {
          setTheme(profile.theme);
          document.documentElement.setAttribute('data-theme', profile.theme);
          localStorage.setItem('app-theme', profile.theme);
        }
      });
    }
  }, [currentUser]);

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
    
    if (currentUser) {
      await updateUserProfile(currentUser.uid, { theme: newTheme });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
