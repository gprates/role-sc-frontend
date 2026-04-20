import api from './api';

interface ListResponse<T> {
  success: true;
  data: T[];
}

export const metadataService = {
  async getMunicipios(): Promise<string[]> {
    const { data } = await api.get<ListResponse<string>>('/municipios');
    return data.data;
  },

  async getCategorias(): Promise<string[]> {
    const { data } = await api.get<ListResponse<string>>('/categorias');
    return data.data;
  },
};
