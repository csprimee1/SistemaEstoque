import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RequestCreate = () => {
  const navigate = useNavigate();
  const [priority, setPriority] = useState('media');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (search.length >= 2) {
      axios.get(`http://localhost:3002/api/materials/search?query=${search}`).then(res => {
        setAvailableMaterials(res.data);
      });
    } else {
      setAvailableMaterials([]);
    }
  }, [search]);

  const addMaterial = (material: any) => {
    if (!selectedMaterials.find(m => m.id === material.id)) {
      setSelectedMaterials([...selectedMaterials, { ...material, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    setSelectedMaterials(prev =>
      prev.map(m => m.id === id ? { ...m, quantity: Number(quantity) } : m)
    );
  };

  const removeMaterial = (id: number) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    try {
      const requestData = {
        priority,
        notes,
        items: selectedMaterials.map(m => ({ material_id: m.id, quantity: m.quantity }))
      };

      await axios.post('http://localhost:3002/api/requests', requestData);
      alert('Solicitação criada com sucesso!');
      navigate('/requests');
    } catch {
      alert('Erro ao criar solicitação.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Nova Solicitação</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-medium">Prioridade</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border rounded">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block font-medium">Buscar Materiais</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Digite para buscar..."
            className="w-full p-2 border rounded"
          />
          <ul className="border rounded mt-2 max-h-40 overflow-y-auto">
            {availableMaterials.map(material => (
              <li
                key={material.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => addMaterial(material)}
              >
                {material.name} (Estoque: {material.quantity})
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-medium">Materiais Selecionados</h2>
          <ul className="space-y-2">
            {selectedMaterials.map(material => (
              <li key={material.id} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <p className="font-medium">{material.name}</p>
                  <input
                    type="number"
                    value={material.quantity}
                    onChange={e => updateQuantity(material.id, e.target.value)}
                    className="w-20 p-1 border rounded mt-1"
                  />
                </div>
                <button
                  onClick={() => removeMaterial(material.id)}
                  className="text-red-600 hover:underline"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Enviar Solicitação
        </button>
      </div>
    </div>
  );
};

export default RequestCreate;
