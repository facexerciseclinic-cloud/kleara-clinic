import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

interface CrudOptions<T> {
  initialData?: T[];
  transformData?: (data: any) => T[];
  dataPath?: string;
}

export const useCrud = <T extends { id: string }>(
  endpoint: string,
  options: CrudOptions<T> = {}
) => {
  const {
    initialData = [],
    transformData,
    dataPath = 'data.data',
  } = options;

  const { showNotification } = useNotifications();
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint);
      let fetchedData: any = response;
      // Navigate to the correct data path in the response object
      dataPath.split('.').forEach((p: string) => {
        fetchedData = fetchedData[p];
      });
      
      const transformed = transformData
        ? transformData(fetchedData)
        : fetchedData;
      setData(transformed);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to fetch data from ${endpoint}`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error(`Error fetching from ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, showNotification, transformData, dataPath]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = async (item: Omit<T, 'id'>) => {
    try {
      const response = await api.post(endpoint, item);
      if (response.data.success) {
        showNotification('Item added successfully', 'success');
        fetchData(); // Refresh data
        return true;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add item';
      showNotification(errorMessage, 'error');
      console.error('Error adding item:', err);
    }
    return false;
  };

  const updateItem = async (id: string, item: Partial<T>) => {
    try {
      const response = await api.put(`${endpoint}/${id}`, item);
      if (response.data.success) {
        showNotification('Item updated successfully', 'success');
        fetchData(); // Refresh data
        return true;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update item';
      showNotification(errorMessage, 'error');
      console.error('Error updating item:', err);
    }
    return false;
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await api.delete(`${endpoint}/${id}`);
      if (response.data.success) {
        showNotification('Item deleted successfully', 'success');
        fetchData(); // Refresh data
        return true;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete item';
      showNotification(errorMessage, 'error');
      console.error('Error deleting item:', err);
    }
    return false;
  };

  return {
    data,
    loading,
    error,
    fetchData,
    addItem,
    updateItem,
    deleteItem,
  };
};
