// services/materialsService.ts
import axios from 'axios';
import { Material } from '../types';

const API_URL = 'http://localhost:3002/api/materials'; // Altere conforme seu backend

export const materialsService = {
  getAll: async (): Promise<Material[]> => {
    const res = await axios.get(API_URL);
    return res.data;
  },

  create: async (data: Omit<Material, 'id' | 'currentStock'>): Promise<Material> => {
    const res = await axios.post(API_URL, data);
    return res.data;
  },

  update: async (id: number, data: Partial<Material>): Promise<Material> => {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
