import React, { createContext, useContext, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from '../components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: ToastType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const showSnackbar = useCallback((msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Toast 
        visible={visible} 
        message={message} 
        type={type} 
        onDismiss={hideSnackbar} 
      />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
