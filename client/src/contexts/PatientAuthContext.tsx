import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface PatientData {
  _id: string;
  name: string;
  hn: string;
  token: string;
}

interface PatientAuthContextType {
  patient: PatientData | null;
  login: (hn: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const PatientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if there's a saved patient token in localStorage
    const savedToken = localStorage.getItem('patientToken');
    const savedPatient = localStorage.getItem('patientData');
    
    if (savedToken && savedPatient) {
      try {
        const patientData = JSON.parse(savedPatient);
        setPatient(patientData);
        setIsAuthenticated(true);
        // Set default Authorization header for axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error('Error parsing saved patient data:', error);
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientData');
      }
    }
  }, []);

  const login = async (hn: string, password: string) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/portal/login`, { hn, password });
      
      const { token, ...patientData } = response.data;
      
      // Save to localStorage
      localStorage.setItem('patientToken', token);
      localStorage.setItem('patientData', JSON.stringify(patientData));
      
      // Set state
      setPatient({ ...patientData, token });
      setIsAuthenticated(true);
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
    
    // Clear state
    setPatient(null);
    setIsAuthenticated(false);
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <PatientAuthContext.Provider value={{ patient, login, logout, isAuthenticated }}>
      {children}
    </PatientAuthContext.Provider>
  );
};

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};
