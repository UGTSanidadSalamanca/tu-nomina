import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Search, Loader2, Bot } from 'lucide-react';
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function Chat() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query + " (Responde basándote en información actualizada sobre SACYL y normativas de nóminas en Castilla y León)",
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      setResponse(result.text || 'No se encontró información.');
    } catch (error) {
      console.error(error);
      setResponse('Hubo un error al consultar la información.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Bot className="w-6 h-6 text-red-600" />
          Asistente Normativo (Búsqueda Web)
        </h2>
        <p className="text-sm text-slate-500 mt-1">Consulta dudas sobre normativa, permisos o condiciones laborales en SACYL.</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input 
            type="text" 
            className="flex-1 rounded-lg border-slate-300 border p-3 text-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="Ej: ¿Cómo se calculan los trienios en SACYL?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Consultar
          </button>
        </form>

        {response && (
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 text-slate-700 text-sm">
            <div className="markdown-body prose prose-red max-w-none">
              <Markdown>{response}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
