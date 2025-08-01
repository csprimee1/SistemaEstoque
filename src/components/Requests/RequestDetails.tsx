import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Clock, 
  AlertCircle,
  Package,
  User,
  Calendar,
  FileText,
  Building2
} from 'lucide-react';
import { Request } from '../../types';
import { requestsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await requestsApi.getById(id!);
      // Mapeie os dados da API
      const mappedRequest = {
        id: response.id,
        status: response.status,
        priority: response.priority,
        notes: response.notes,
        createdAt: response.created_at,
        updatedAt: response.updatedAt,
        requesterId: response.requesterId,
        requester: {
          name: response.requester.name,
          school: response.school
        },
        approver: response.approver ? { 
          name: response.approver.name 
        } : undefined,
        dispatcher: response.dispatcher ? { 
          name: response.dispatcher.name 
        } : undefined,
        approvedAt: response.approved_at,
        dispatchedAt: response.dispatched_at,
        items: response.items?.map((item: any) => ({
          id: item.id,
          materialId: item.material_id,
          material: {
            id: item.material.id,
            name: item.material.name,
            unit: item.material.unit,
            category: item.category,
            description: item.description
          },
          requestedQuantity: item.requested_quantity,
          approvedQuantity: item.approved_quantity,
          dispatchedQuantity: item.dispatched_quantity,
          notes: item.notes
        }))
      };
      console.log(response);
      setRequest(mappedRequest);
    } catch (error) {
      console.error('Erro ao carregar solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-5 h-5" />;
      case 'aprovado':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejeitado':
        return <XCircle className="w-5 h-5" />;
      case 'despachado':
        return <Truck className="w-5 h-5" />;
      case 'cancelado':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprovado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'despachado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = () => {
    if (!request || !user) return false;
    return request.requesterId === user.id && request.status === 'pendente';
  };

  const canApprove = () => {
    if (!request || !user) return false;
    return ['despachante', 'administrador'].includes(user.role) && request.status === 'pendente';
  };

  const canDispatch = () => {
    if (!request || !user) return false;
    return ['despachante', 'administrador'].includes(user.role) && request.status === 'aprovado';
  };

  const handleApprove = async () => {
    if (!request) return;
    
    setActionLoading(true);
    try {
      await requestsApi.approve(
        request.id, 
        user?.id || "null", 
        request.items?.map(item => ({
          item_id: item.id,
          quantity: item.requestedQuantity
        })) || []
      );
      fetchRequest();
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    
    setActionLoading(true);
    try {
      await requestsApi.reject(request.id, reason);
      fetchRequest();
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      alert('Erro ao rejeitar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!request) return;
    
    setActionLoading(true);
    try {
      await requestsApi.dispatch(
        request.id, 
        user?.id || "null"
      );
      fetchRequest();
    } catch (error) {
      console.error('Erro ao despachar solicitação:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    console.log(request)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-medium text-red-800 mb-2">
            Solicitação não encontrada
          </h2>
          <p className="text-red-700 mb-4">
            A solicitação que você está procurando não existe ou você não tem permissão para visualizá-la.
          </p>
          <button
            onClick={() => navigate('/requests')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitação #{request.id.toString().padStart(4, '0')}
            </h1>
            <p className="text-gray-600">
              Criada em {format(new Date(request.createdAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canEdit() && (
            <button
              onClick={() => navigate(`/requests/${request.id}/edit`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit3 size={16} />
              <span>Editar</span>
            </button>
          )}

          {canApprove() && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>Aprovar</span>
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <XCircle size={16} />
                <span>Rejeitar</span>
              </button>
            </>
          )}

          {canDispatch() && (
            <button
              onClick={handleDispatch}
              disabled={actionLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Truck size={16} />
              <span>Despachar</span>
            </button>
          )}
        </div>
      </div>

      {/* Status e Informações Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informações da Solicitação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-2 capitalize">{request.status}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(request.priority)}`}>
                    {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.requester?.name}</p>
                      {request.requester?.school && (
                        <p className="text-xs text-gray-500">{request.requester.school}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {format(new Date(request.createdAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {request.notes && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Itens da Solicitação */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Itens Solicitados</h2>
            
            <div className="space-y-4">
              {request.items?.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.material?.name}</h3>
                        <p className="text-sm text-gray-600">{item.material?.category}</p>
                        {item.material?.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.material.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.requestedQuantity} {item.material?.unit}
                      </p>
                      <p className="text-xs text-gray-500">Solicitado</p>
                    </div>
                  </div>

                  {(item.approvedQuantity !== undefined || item.dispatchedQuantity !== undefined) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {item.approvedQuantity !== undefined && (
                          <div>
                            <span className="text-gray-600">Aprovado: </span>
                            <span className="font-medium text-blue-600">
                              {item.approvedQuantity} {item.material?.unit}
                            </span>
                          </div>
                        )}
                        {item.dispatchedQuantity !== undefined && (
                          <div>
                            <span className="text-gray-600">Despachado: </span>
                            <span className="font-medium text-green-600">
                              {item.dispatchedQuantity} {item.material?.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        <strong>Observações:</strong> {item.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Histórico</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Solicitação criada</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(request.createdAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-600 mt-1">por {request.requester?.name}</p>
              </div>
            </div>

            {request.approvedAt && (
              <div className="flex items-start space-x-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  request.status === 'rejeitado' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {request.status === 'rejeitado' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Solicitação {request.status === 'rejeitado' ? 'rejeitada' : 'aprovada'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(request.approvedAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">por {request.approver?.name}</p>
                </div>
              </div>
            )}

            {request.dispatchedAt && (
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Solicitação despachada</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(request.dispatchedAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">por {request.dispatcher?.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;