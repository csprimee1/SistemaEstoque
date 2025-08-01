import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Package } from 'lucide-react';
import { Material, Request, RequestItem } from '../../types';
import { materialsApi, requestsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface RequestFormItem {
  materialId: string;
  requestedQuantity: number;
  notes?: string;
  material?: Material;
}

const RequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [request, setRequest] = useState<Request | null>(null);

  const [formData, setFormData] = useState({
    priority: 'media' as 'baixa' | 'media' | 'alta',
    notes: '',
  });

  const [items, setItems] = useState<RequestFormItem[]>([
    { materialId: null, requestedQuantity: 0, notes: '' }
  ]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const materialsResponse = await materialsApi.getAll();
      setMaterials(materialsResponse);

      if (isEditing && id) {
        const requestResponse = await requestsApi.getById(parseInt(id));
        const mappedRequest = {
          ...requestResponse,
          requesterId: requestResponse.requester_id,
          items: requestResponse.items.map((item: any) => ({
            id: item.id,
            materialId: item.material_id,
            requestedQuantity: item.requested_quantity,
            notes: item.notes,
            material: {
              id: item.material_id,
              name: item.material_name,
              unit: item.unit
            }
          }))
        };
        setRequest(mappedRequest);
        setFormData({
          priority: mappedRequest.priority,
          notes: mappedRequest.notes || '',
        });
        setItems(mappedRequest.items);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };


  const addItem = () => {
    setItems([...items, { materialId: 0, requestedQuantity: 0, notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequestFormItem, value: any) => {
    const updatedItems = [...items];
    
    if (field === 'materialId') {
      updatedItems[index] = { 
        ...updatedItems[index], 
        [field]: value === '' ? null : value 
      };
      
      const material = materials.find(m => m.id === value);
      updatedItems[index].material = material;
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }

    setItems(updatedItems);
  };
  const validateForm = (): string | null => {
    if (items.length === 0) {
      return 'Adicione pelo menos um item à solicitação';
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.materialId) {
        return `Selecione um material para o item ${i + 1}`;
      }
      if (!item.requestedQuantity || item.requestedQuantity <= 0) {
        return `Informe uma quantidade válida para o item ${i + 1}`;
      }
    }

    const materialIds = items.map(item => item.materialId).filter(Boolean) as string[];
    const uniqueIds = new Set(materialIds);
    if (materialIds.length !== uniqueIds.size) {
      return 'Não é possível adicionar o mesmo material mais de uma vez';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);

    try {
      const requestData = {
        requester_id: user?.id || 0,
        priority: formData.priority,
        notes: formData.notes,
        items: items.map(item => ({
          material_id: item.materialId,
          quantity: item.requestedQuantity,
          notes: item.notes
        }))
      };

      if (isEditing && id) {
        await requestsApi.update(parseInt(id), requestData);
      } else {
        await requestsApi.create(requestData);
      }

      navigate('/requests');
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
    } finally {
      setSaving(false);
    }
  };

  const canEdit = () => {
    if (!isEditing) return true;
    if (!request) return false;
    
    // Só pode editar se for o próprio solicitante e a solicitação estiver pendente
    return request.requesterId === user?.id && request.status === 'pendente';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isEditing && !canEdit()) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">
            Não é possível editar esta solicitação
          </h2>
          <p className="text-yellow-700 mb-4">
            {request?.status !== 'pendente' 
              ? 'Apenas solicitações pendentes podem ser editadas.'
              : 'Você só pode editar suas próprias solicitações.'
            }
          </p>
          <button
            onClick={() => navigate('/requests')}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Voltar às Solicitações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/requests')}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Solicitação' : 'Nova Solicitação'}
          </h1>
        </div>
      </div>

      {isEditing && request && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">
                Solicitação #{request.id.toString().padStart(4, '0')}
              </h3>
              <p className="text-sm text-blue-700">
                Status: <span className="capitalize font-medium">{request.status}</span>
              </p>
            </div>
            <div className="text-right text-sm text-blue-700">
              <p>Criada em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}</p>
              {request.updatedAt !== request.createdAt && (
                <p>Atualizada em: {new Date(request.updatedAt).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Gerais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solicitante
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-gray-900">{user?.name}</p>
                {user?.school && (
                  <p className="text-sm text-gray-600">{user.school}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Descreva detalhes sobre a solicitação, urgência, finalidade, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Itens Solicitados</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Adicionar Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material
                    </label>
                    <select
                      value={item.materialId || ''}
                      onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um material</option>
                      {materials
                        .filter(material => 
                          !items.some((otherItem, otherIndex) => 
                            otherIndex !== index && otherItem.materialId === material.id
                          )
                        )
                        .map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.requestedQuantity}
                      onChange={(e) => updateItem(index, 'requestedQuantity', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {item.material && (
                      <p className="text-xs text-gray-500 mt-1">
                        Unidade: {item.material.unit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações do Item
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Observações específicas deste item"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {item.material && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.material.name}</p>
                        <p className="text-xs text-gray-600">
                          Categoria: {item.material.category} | 
                          Estoque atual: {item.material.currentStock.toLocaleString()} {item.material.unit}
                        </p>
                        {item.material.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.material.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Solicitação')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;