import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  Building2, 
  User, 
  Package, 
  Truck,
  Search,
  X
} from 'lucide-react';
import { Request, Material, Supplier, User as UserType, StockEntry } from '../../types';
import { requestsApi, materialsApi, suppliersApi, usersApi, stockEntriesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportFilters {
  startDate: string;
  endDate: string;
  supplierId: string;
  school: string;
  requesterId: string;
  dispatcherId: string;
  materialId: string;
  status: string;
  reportType: 'requests' | 'stock-entries' | 'materials';
}

interface ReportData {
  requests: Request[];
  stockEntries: StockEntry[];
  materials: Material[];
}

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    supplierId: '',
    school: '',
    requesterId: '',
    dispatcherId: '',
    materialId: '',
    status: '',
    reportType: 'requests'
  });

  const [data, setData] = useState<ReportData>({
    requests: [],
    stockEntries: [],
    materials: []
  });

  const [filteredData, setFilteredData] = useState<ReportData>({
    requests: [],
    stockEntries: [],
    materials: []
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [schools, setSchools] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, data]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [requestsResponse, stockEntriesResponse, materialsResponse, suppliersResponse, usersResponse] = await Promise.all([
        requestsApi.getAll(),
        stockEntriesApi.getAll(),
        materialsApi.getAll(),
        suppliersApi.getAll(),
        usersApi.getAll()
      ]);

      console.log('Requests response:', requestsResponse);
      console.log('Primeiro request items:', requestsResponse[0]?.items);

      // Mapear requests com items detalhados - CORRIGIDO
      const mappedRequests = requestsResponse.map((r: any) => {
        // Processar os items para garantir que o material está sendo acessado corretamente
        const processedItems = r.items ? r.items.map((item: any) => ({
          id: item.id,
          requested_quantity: item.requested_quantity,
          dispatched_quantity: item.dispatched_quantity,
          approved_quantity: item.approved_quantity,
          material: item.material ? {
            id: item.material.id,
            name: item.material.name,
            unit: item.material.unit,
            category: item.material.category
          } : {
            name: 'Material não encontrado',
            unit: ''
          }
        })) : [];

        return {
          id: r.id,
          status: r.status,
          priority: r.priority,
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          itemsCount: processedItems.length,
          totalRequested: r.totalRequested || r.total_requested || 0,
          requesterId: r.requesterId || r.requester_id || null,
          dispatchedBy: r.dispatchedBy || r.dispatched_by || null,
          approver: { 
            id: r.approver_id,
            name: r.approver_name || r.approver?.name || 'N/A' 
          },
          dispatcher: { 
            id: r.dispatcher_id,
            name: r.dispatcher_name || r.dispatcher?.name || 'N/A' 
          },
          requester: {
            id: r.requester_id || r.requesterId,
            name: r.requester_name || r.requester?.name || 'N/A',
            school: r.school || r.requester?.school || ''
          },
          items: processedItems // Itens processados com material correto
        };
      });
      console.log('Requests mapeados:', mappedRequests);
      console.log('Primeiro request mapeado:', mappedRequests[0]);
      console.log('Items do primeiro request mapeado:', mappedRequests[0]?.items);

      const mappedStockEntries = stockEntriesResponse.map((entry: any) => ({
        id: entry.id,
        materialId: entry.materialId,
        supplierId: entry.supplierId,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
        batch: entry.batch,
        expiryDate: entry.expiryDate,
        notes: entry.notes,
        createdAt: entry.createdAt,
        createdBy: entry.createdBy,
        user: { name: entry.createdUser || 'N/A' },
        material: {
          name: entry.material?.name || 'N/A',
          unit: entry.material?.unit || ''
        },
        supplier: {
          name: entry.supplier?.name || 'N/A'
        }
      }));

      const mappedMaterials = materialsResponse.map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        unit: m.unit,
        currentStock: m.currentStock || 0,
        minStock: m.minStock || 0,
        description: m.description,
        updatedAt: m.updatedAt
      }));

      setData({
        requests: mappedRequests,
        stockEntries: mappedStockEntries,
        materials: mappedMaterials
      });

      setSuppliers(suppliersResponse);
      setMaterials(materialsResponse);
      setUsers(usersResponse);

      // Extrair escolas únicas
      const uniqueSchools = [...new Set(usersResponse
        .filter(u => u.school)
        .map(u => u.school!)
      )];
      setSchools(uniqueSchools);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredRequests = [...data.requests];
    let filteredStockEntries = [...data.stockEntries];
    let filteredMaterials = [...data.materials];

    // Filtros de data
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredRequests = filteredRequests.filter(r => new Date(r.createdAt) >= startDate);
      filteredStockEntries = filteredStockEntries.filter(e => new Date(e.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filteredRequests = filteredRequests.filter(r => new Date(r.createdAt) <= endDate);
      filteredStockEntries = filteredStockEntries.filter(e => new Date(e.createdAt) <= endDate);
    }

    // Filtro de fornecedor
    if (filters.supplierId) {
      filteredStockEntries = filteredStockEntries.filter(e => e.supplierId?.toString() === filters.supplierId);
    }

    // Filtro de escola
    if (filters.school) {
      filteredRequests = filteredRequests.filter(r => r.requester?.school === filters.school);
    }

    // Filtro de solicitante
    if (filters.requesterId) {
      filteredRequests = filteredRequests.filter(r => r.requesterId?.toString() === filters.requesterId);
    }

    // Filtro de despachante
    if (filters.dispatcherId) {
      filteredRequests = filteredRequests.filter(r => r.dispatchedBy?.toString() === filters.dispatcherId);
    }

    // Filtro de material
    if (filters.materialId) {
      filteredRequests = filteredRequests.filter(r => 
        r.items?.some((item: any) => item.material?.id?.toString() === filters.materialId)
      );
      filteredStockEntries = filteredStockEntries.filter(e => e.materialId?.toString() === filters.materialId);
      filteredMaterials = filteredMaterials.filter(m => m.id.toString() === filters.materialId);
    }

    // Filtro de status
    if (filters.status) {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status);
    }

    setFilteredData({
      requests: filteredRequests,
      stockEntries: filteredStockEntries,
      materials: filteredMaterials
    });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      supplierId: '',
      school: '',
      requesterId: '',
      dispatcherId: '',
      materialId: '',
      status: '',
      reportType: 'requests'
    });
  };

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Sistema de Estoque - Secretaria de Educação', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      
      let reportTitle = '';
      switch (filters.reportType) {
        case 'requests':
          reportTitle = 'Relatório de Solicitações';
          break;
        case 'stock-entries':
          reportTitle = 'Relatório de Entradas de Estoque';
          break;
        case 'materials':
          reportTitle = 'Relatório de Materiais';
          break;
      }
      
      doc.text(reportTitle, pageWidth / 2, 30, { align: 'center' });
      
      // Informações dos filtros
      doc.setFontSize(10);
      let yPos = 45;
      
      if (filters.startDate || filters.endDate) {
        const dateRange = `Período: ${filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'} até ${filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}`;
        doc.text(dateRange, 20, yPos);
        yPos += 5;
      }
      
      if (filters.school) {
        doc.text(`Escola: ${filters.school}`, 20, yPos);
        yPos += 5;
      }
      
      if (filters.supplierId) {
        const supplier = suppliers.find(s => s.id.toString() === filters.supplierId);
        doc.text(`Fornecedor: ${supplier?.name || 'N/A'}`, 20, yPos);
        yPos += 5;
      }
      
      if (filters.materialId) {
        const material = materials.find(m => m.id.toString() === filters.materialId);
        doc.text(`Material: ${material?.name || 'N/A'}`, 20, yPos);
        yPos += 5;
      }
      
      yPos += 10;
      
      // Gerar tabela baseada no tipo de relatório
      if (filters.reportType === 'requests') {
        generateRequestsTable(doc, yPos);
      } else if (filters.reportType === 'stock-entries') {
        generateStockEntriesTable(doc, yPos);
      } else if (filters.reportType === 'materials') {
        generateMaterialsTable(doc, yPos);
      }
      
      // Rodapé
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, doc.internal.pageSize.height - 10);
      }
      
      // Salvar PDF
      const fileName = `relatorio_${filters.reportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatório PDF');
    } finally {
      setGenerating(false);
    }
  };

  const generateRequestsTable = (doc: any, startY: number) => {
    const tableData: any[] = [];
    
    filteredData.requests.forEach(request => {
      // Se tiver items, cria uma linha para cada item
      if (request.items && request.items.length > 0) {
        request.items.forEach((item: any, index: number) => {
          tableData.push([
            // Primeira linha do request mostra o solicitante, nas linhas seguintes fica vazio
            index === 0 ? request.requester?.name || 'N/A' : '',
            index === 0 ? request.requester?.school || 'N/A' : '',
            item.material?.name || 'Material não encontrado',
            `${item.requested_quantity || 0} ${item.material?.unit || ''}`,
            request.status.charAt(0).toUpperCase() + request.status.slice(1),
            request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
            request.createdAt
              ? format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: ptBR })
              : 'Data inválida',
            request.approver?.name || 'N/A',
            request.dispatcher?.name || 'N/A'
          ]);
        });
      } else {
        // Se não tiver items, mostra uma linha com "Sem itens"
        tableData.push([
          request.requester?.name || 'N/A',
          request.requester?.school || 'N/A',
          'Sem itens',
          '-',
          request.status.charAt(0).toUpperCase() + request.status.slice(1),
          request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
          request.createdAt
            ? format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: ptBR })
            : 'Data inválida',
          request.approver?.name || 'N/A',
          request.dispatcher?.name || 'N/A'
        ]);
      }
    });

    (doc as any).autoTable({
      startY: startY,
      head: [['Solicitante', 'Escola', 'Material', 'Quantidade', 'Status', 'Prioridade', 'Data', 'Aprovador', 'Despachante']],
      body: tableData,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
      }
    });
  };

  const generateStockEntriesTable = (doc: any, startY: number) => {
    const tableData = filteredData.stockEntries.map(entry => [
      entry.material?.name || 'N/A',
      entry.supplier?.name || 'N/A',
      `${entry.quantity.toLocaleString()} ${entry.material?.unit || ''}`,
      entry.unitPrice ? `R$ ${Number(entry.unitPrice).toFixed(2)}` : 'N/A',
      entry.batch || 'N/A',
      entry.createdAt
        ? format(new Date(entry.createdAt), 'dd/MM/yyyy', { locale: ptBR })
        : 'Data inválida',
      entry.user?.name || 'N/A'
    ]);

    (doc as any).autoTable({
      startY: startY,
      head: [['Material', 'Fornecedor', 'Quantidade', 'Preço Unit.', 'Lote', 'Data', 'Responsável']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  };

  const generateMaterialsTable = (doc: any, startY: number) => {
    const tableData = filteredData.materials.map(material => [
      material.name,
      material.category,
      material.unit,
      material.currentStock?.toLocaleString() || '0',
      material.minStock?.toLocaleString() || '0',
      Number(material.currentStock) <= Number(material.minStock) ? 'Baixo' : 'OK',
      material.updatedAt
        ? format(new Date(material.updatedAt), 'dd/MM/yyyy', { locale: ptBR })
        : 'Data inválida'
    ]);

    (doc as any).autoTable({
      startY: startY,
      head: [['Material', 'Categoria', 'Unidade', 'Estoque Atual', 'Estoque Mín.', 'Status', 'Atualizado']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [168, 85, 247] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  };

  const getDataCount = () => {
    switch (filters.reportType) {
      case 'requests':
        return filteredData.requests.length;
      case 'stock-entries':
        return filteredData.stockEntries.length;
      case 'materials':
        return filteredData.materials.length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <button
          onClick={generatePDF}
          disabled={generating || getDataCount() === 0}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Download size={16} />
          )}
          <span>{generating ? 'Gerando...' : 'Exportar PDF'}</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h2>
          <button
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X size={16} />
            <span>Limpar Filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Tipo de Relatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Tipo de Relatório
            </label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="requests">Solicitações</option>
              <option value="stock-entries">Entradas de Estoque</option>
              <option value="materials">Materiais</option>
            </select>
          </div>

          {/* Intervalo de Datas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="h-4 w-4 inline mr-1" />
              Material
            </label>
            <select
              value={filters.materialId}
              onChange={(e) => setFilters({ ...filters, materialId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os materiais</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Fornecedor - Apenas para entradas */}
          {filters.reportType === 'stock-entries' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Fornecedor
              </label>
              <select
                value={filters.supplierId}
                onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os fornecedores</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Escola - Apenas para solicitações */}
          {filters.reportType === 'requests' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Escola
              </label>
              <select
                value={filters.school}
                onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as escolas</option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Solicitante - Apenas para solicitações */}
          {filters.reportType === 'requests' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Solicitante
              </label>
              <select
                value={filters.requesterId}
                onChange={(e) => setFilters({ ...filters, requesterId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os solicitantes</option>
                {users.filter(u => u.role === 'solicitante').map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.school && `- ${user.school}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Despachante - Apenas para solicitações */}
          {filters.reportType === 'requests' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Truck className="h-4 w-4 inline mr-1" />
                Despachante
              </label>
              <select
                value={filters.dispatcherId}
                onChange={(e) => setFilters({ ...filters, dispatcherId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os despachantes</option>
                {users.filter(u => ['despachante', 'administrador'].includes(u.role)).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Status - Apenas para solicitações */}
          {filters.reportType === 'requests' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="despachado">Despachado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Resumo dos Resultados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Resultados</h3>
            <p className="text-gray-600">
              {getDataCount()} {filters.reportType === 'requests' ? 'solicitações' : 
                filters.reportType === 'stock-entries' ? 'entradas de estoque' : 'materiais'} encontrados
            </p>
          </div>
          
          {getDataCount() > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Clique em "Exportar PDF" para gerar o relatório
              </p>
            </div>
          )}
        </div>

        {/* Prévia dos dados para requests */}
        {filters.reportType === 'requests' && filteredData.requests.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Escola</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.requests.slice(0, 5).map(request => 
                  request.items && request.items.length > 0 ? (
                    request.items.map((item: any, idx: number) => (
                      <tr key={`${request.id}-${idx}`}>
                        <td className="px-3 py-2 text-sm text-gray-900">{idx === 0 ? request.requester?.name : ''}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{idx === 0 ? request.requester?.school : ''}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.material?.name || 'Material não encontrado'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.requested_quantity || 0} {item.material?.unit || ''}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                            request.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                            request.status === 'despachado' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={request.id}>
                      <td className="px-3 py-2 text-sm text-gray-900">{request.requester?.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{request.requester?.school}</td>
                      <td className="px-3 py-2 text-sm text-gray-900" colSpan={2}>Sem itens</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                          request.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                          request.status === 'despachado' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            {filteredData.requests.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                Mostrando 5 de {filteredData.requests.length} solicitações
              </p>
            )}
          </div>
        )}

        {/* Prévia dos dados para entradas de estoque */}
        {filters.reportType === 'stock-entries' && filteredData.stockEntries.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.stockEntries.slice(0, 10).map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{entry.material?.name || 'N/A'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{entry.supplier?.name || 'N/A'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{entry.quantity} {entry.material?.unit || ''}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {entry.createdAt ? format(new Date(entry.createdAt), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.stockEntries.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Mostrando 10 de {filteredData.stockEntries.length} entradas
              </p>
            )}
          </div>
        )}

        {/* Prévia dos dados para materiais */}
        {filters.reportType === 'materials' && filteredData.materials.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.materials.slice(0, 10).map((material) => (
                  <tr key={material.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{material.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{material.category}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{material.currentStock} {material.unit}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{material.minStock} {material.unit}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        Number(material.currentStock) <= Number(material.minStock) 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {Number(material.currentStock) <= Number(material.minStock) ? 'Baixo' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.materials.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Mostrando 10 de {filteredData.materials.length} materiais
              </p>
            )}
          </div>
        )}

        {getDataCount() === 0 && (
          <div className="mt-6 text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros para encontrar os dados desejados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;