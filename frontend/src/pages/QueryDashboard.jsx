import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Send, Terminal, LayoutDashboard, Bookmark, Check, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QueryDashboard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { logout, user } = useAuth();
  const [addedStocks, setAddedStocks] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setAddedStocks(new Set());

    try {
      const res = await api.post('/screener/query', { query });
      setResult(res.data);
      toast.success(`Found ${res.data.count} results!`);
    } catch (err) {
      toast.error('Failed to process query');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (ticker) => {
    try {
      await api.post('/user/watchlist/add', { ticker });
      setAddedStocks(prev => new Set(prev).add(ticker));
      toast.success(`${ticker} saved`);
    } catch (err) {
      toast.error("Failed to add");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      
      {/* Minimal Header */}
      <header className="px-6 py-4 flex justify-between items-center glass fixed top-0 w-full z-20">
        <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
           <div className="bg-black text-white p-1.5 rounded-lg">
             <Terminal className="w-5 h-5" />
           </div>
           StockOS
        </Link>
        <div className="flex items-center gap-4 text-sm">
           <span className="text-gray-500">Logged in as <span className="text-gray-900 font-medium">{user?.username}</span></span>
           <div className="h-4 w-px bg-gray-200"></div>
           <button onClick={logout} className="text-gray-500 hover:text-red-600 transition">Log out</button>
           <Link to="/" className="btn-primary flex items-center gap-2 py-2 px-4 text-xs">
             Dashboard <ArrowRight className="w-3 h-3" />
           </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-32 px-6">
        
        {/* Search Area */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Ask the Market.</h2>
          <p className="text-lg text-gray-500">Describe your ideal investment using natural language.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 relative transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500">
          <form onSubmit={handleSearch}>
            <textarea
              className="w-full p-6 text-lg border-none focus:ring-0 outline-none resize-none h-32 rounded-xl text-gray-800 placeholder-gray-300 font-medium"
              placeholder="E.g., Find me tech companies with revenue growth > 20% and a PE ratio under 30..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(e); }}}
            />
            <div className="flex justify-between items-center px-4 pb-2">
               <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                 <Sparkles className="w-3 h-3 text-blue-500" />
                 <span>AI Powered Screener</span>
               </div>
               <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send className="w-5 h-5" />}
               </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-12 animate-fade-in">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold text-gray-900">Results</h3>
              <span className="text-sm text-gray-500">{result.count} matches found</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               {result.count > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                       <tr>
                         {Object.keys(result.data[0]).map((key) => (
                           <th key={key} className="px-6 py-4 whitespace-nowrap font-normal capitalize">
                             {key.replace(/_/g, ' ')}
                           </th>
                         ))}
                         <th className="px-6 py-4 text-right font-normal">Save</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {result.data.map((row, idx) => (
                         <tr key={idx} className="hover:bg-gray-50 transition">
                           {Object.values(row).map((val, i) => (
                             <td key={i} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                               {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val}
                             </td>
                           ))}
                           <td className="px-6 py-4 text-right">
                             <button
                               onClick={() => addToWatchlist(row.ticker_symbol)}
                               disabled={addedStocks.has(row.ticker_symbol)}
                               className={`p-2 rounded-lg transition ${
                                 addedStocks.has(row.ticker_symbol)
                                   ? 'bg-green-100 text-green-700'
                                   : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                               }`}
                             >
                               {addedStocks.has(row.ticker_symbol) ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="p-12 text-center text-gray-500">No matches found. Try relaxing your filters.</div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}