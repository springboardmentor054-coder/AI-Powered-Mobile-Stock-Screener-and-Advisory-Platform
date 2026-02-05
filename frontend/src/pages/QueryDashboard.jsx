import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Send, Terminal, LayoutDashboard, Bookmark, Check, LogOut, ArrowRight, Sparkles, Search } from 'lucide-react';
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
      const res = await api.post('/query/query', { query });
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
    <div className="min-h-screen bg-[#F5F5F7] pb-20 font-sans text-[#1d1d1f]">
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-gray-200/50 fixed top-0 w-full z-20">
        <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
           <div className="bg-[#0071e3] text-white p-1.5 rounded-lg shadow-sm">
             <Terminal className="w-5 h-5" />
           </div>
           StockOS
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
           <span className="text-gray-500 hidden sm:inline">Logged in as <span className="text-gray-900">{user?.username}</span></span>
           <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
           <button onClick={logout} className="text-gray-500 hover:text-red-600 transition-colors">Log out</button>
           <Link to="/" className="bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full flex items-center gap-2 py-2 px-4 text-xs font-semibold shadow-sm transition-all">
             Dashboard <ArrowRight className="w-3 h-3" />
           </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-32 px-6">
        
        {/* Search Area */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Ask the Market.</h2>
          <p className="text-lg text-gray-500 font-medium">Describe your ideal investment using natural language.</p>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-100 p-2 relative transition-all group focus-within:ring-4 focus-within:ring-[#0071e3]/10 focus-within:border-[#0071e3]/30">
          <form onSubmit={handleSearch}>
            <textarea
              className="w-full p-6 text-lg border-none focus:ring-0 outline-none resize-none h-32 rounded-xl text-gray-900 placeholder-gray-400 font-medium bg-transparent"
              placeholder="E.g., Find me tech companies with revenue growth > 20% and a PE ratio under 30..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(e); }}}
            />
            <div className="flex justify-between items-center px-4 pb-2">
               <div className="flex items-center gap-2 text-xs text-[#0071e3] font-bold bg-blue-50 px-3 py-1.5 rounded-full">
                 <Sparkles className="w-3 h-3" />
                 <span>AI Powered Screener</span>
               </div>
               <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="bg-[#0071e3] hover:bg-[#0077ED] text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
               >
                 {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send className="w-5 h-5" />}
               </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-12 animate-fade-in pb-10">
            <div className="flex justify-between items-end mb-6 border-b border-gray-200/60 pb-4">
              <h3 className="text-xl font-bold text-gray-900">Results</h3>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{result.count} matches found</span>
            </div>
            
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
               {result.count > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                       <tr>
                         {/* Filter out 'description' column in Header */}
                         {Object.keys(result.data[0])
                           .filter(key => key !== 'description')
                           .map((key) => (
                           <th key={key} className="px-6 py-4 whitespace-nowrap text-xs uppercase tracking-wider text-gray-400">
                             {key.replace(/_/g, ' ')}
                           </th>
                         ))}
                         <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-gray-400">Save</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {result.data.map((row, idx) => (
                         <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                           {/* Filter keys here too to match header columns */}
                           {Object.keys(result.data[0])
                             .filter(key => key !== 'description')
                             .map((key, i) => {
                               const val = row[key];
                               return (
                                 <td key={i} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                   {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val}
                                 </td>
                               );
                           })}
                           <td className="px-6 py-4 text-right">
                             <button
                               onClick={() => addToWatchlist(row.ticker_symbol)}
                               disabled={addedStocks.has(row.ticker_symbol)}
                               className={`p-2 rounded-lg transition-all ${
                                 addedStocks.has(row.ticker_symbol)
                                   ? 'bg-green-100 text-green-600'
                                   : 'text-gray-300 hover:bg-[#0071e3] hover:text-white group-hover:text-gray-400'
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
                 <div className="py-20 flex flex-col items-center justify-center text-center">
                   <div className="bg-gray-50 p-4 rounded-full mb-4">
                      <Search className="w-6 h-6 text-gray-400" />
                   </div>
                   <p className="text-gray-900 font-medium">No matches found</p>
                   <p className="text-gray-500 text-sm mt-1">Try relaxing your filters or rephrasing.</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}