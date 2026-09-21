// Storage utilities for managing websites and scan results via the API
import axios from 'axios';

export const getStoredWebsites = async () => {
  try {
    const response = await axios.get('/api/websites');
    return response.data || [];
  } catch (error) {
    console.error('Error loading websites from API:', error);
    return [];
  }
};

export const saveWebsite = async (website) => {
  try {
    await axios.post('/api/websites', website);
    return true;
  } catch (error) {
    console.error('Error saving website to API:', error);
    return false;
  }
};

export const deleteWebsite = async (websiteId) => {
  try {
    await axios.delete(`/api/websites/${websiteId}`);
    return true;
  } catch (error) {
    console.error('Error deleting website via API:', error);
    return false;
  }
};

export const saveScanResult = async (websiteId, scanResult) => {
  try {
    await axios.post(`/api/websites/${websiteId}/scan`, scanResult);
    return true;
  } catch (error) {
    console.error('Error saving scan result via API:', error);
    return false;
  }
};
