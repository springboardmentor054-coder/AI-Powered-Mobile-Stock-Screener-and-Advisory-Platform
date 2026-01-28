import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Send, Terminal, Database, Code, LayoutList } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QueryDashboard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Store full response
  const [result, setResult] = useState(null); 
  
  const { logout, user } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/query/query', { query });
      
      // Backend returns: { message, dsl, sql, count, data }
      setResult(res.data);
      toast.success(`Found ${res.data.count} results!`);
    } catch (err) {
      toast.error('Failed to process query');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Terminal className="w-6 h-6 text-blue-600" />
          Stock Screener AI
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hello, {user?.username}</span>
          <button onClick={logout} className="text-red-600 hover:text-red-700 font-medium text-sm">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto mt-10 p-6">
        
        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
             <LayoutList className="w-5 h-5 text-blue-500" />
             Describe your stock criteria
          </h2>
          <form onSubmit={handleSearch} className="relative">
            <textarea
              className="w-full p-4 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-28 bg-gray-50 text-gray-800 placeholder-gray-400 font-medium"
              placeholder="E.g., Find companies with PE ratio less than 20 and promoter holding greater than 50%..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50 shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Analyzing Market Data...</p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. Data Table (The most important part) */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Screened Results
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                  {result.count} Companies Found
                </span>
              </div>
              
              <div className="overflow-x-auto">
                {result.count > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                      <tr>
                        {/* Dynamically generate headers from the first result */}
                        {Object.keys(result.data[0]).map((key) => (
                          <th key={key} className="px-6 py-3 whitespace-nowrap">
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50 transition">
                          {Object.values(row).map((val, i) => (
                            <td key={i} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {/* Simple formatting for numbers */}
                              {typeof val === 'number' && val % 1 !== 0 
                                ? val.toFixed(2) 
                                : val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No companies matched your criteria.
                  </div>
                )}
              </div>
            </div>

           
          </div>
        )}
      </div>
    </div>
  );
}