import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RequestsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/requests/${id}`)
      .then(res => {
        setRequest(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Erro ao buscar os dados.');
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta requisição?')) {
      try {
        await axios.delete(`/api/requests/${id}`);
        navigate('/requests');
      } catch {
        alert('Erro ao excluir a requisição.');
      }
    }
  };

  const handleDeliver = async () => {
    try {
      await axios.post(`/api/requests/${id}/deliver`);
      alert('Entrega registrada com sucesso!');
      navigate('/requests');
    } catch {
      alert('Erro ao registrar entrega.');
    }
  };

  const handleEdit = () => {
    navigate(`/requests/edit/${id}`);
  };

  if (loading) return <p className="p-4">Carregando...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Detalhes da Requisição #{id}</h2>
      <div className="mb-6 bg-white shadow p-4 rounded">
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Data:</strong> {new Date(request.date).toLocaleDateString()}</p>
        <p><strong>Solicitante:</strong> {request.requester}</p>
        {/* Adicione mais campos conforme sua estrutura */}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleEdit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Editar
        </button>
        <button
          onClick={handleDeliver}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Marcar como Entregue
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default RequestsDetails;
