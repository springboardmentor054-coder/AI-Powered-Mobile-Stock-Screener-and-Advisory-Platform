import { useEffect, useState } from 'react';
import api from '../utils/api';
import AlertModal from '../components/AlertModal';
import NotificationBell from '../components/NotificationBell';
import { Bookmark, ArrowUpRight, ArrowDownRight, Trash2, Search, Bell, TrendingUp, Sparkles, Plus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState({ ticker: '', price: 0 });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/user/dashboard');
      setData(res.data);
    } catch (err) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (ticker) => {
    try {
      await api.post('/user/watchlist/remove', { ticker });
      setData(prev => ({ ...prev, watchlist: prev.watchlist.filter(item => item.ticker_symbol !== ticker) }));
      toast.success("Asset removed");
    } catch (err) { toast.error("Failed to remove"); }
  };

  const openAlertModal = (ticker, price) => {
    setSelectedStock({ ticker, price });
    setIsAlertOpen(true);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F5F7]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20 font-sans selection:bg-blue-100">
      
      {/* --- Sticky Glass Header --- */}
      <nav className="fixed top-0 w-full z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900">StockOS</span>
          </div>
          
          <div className="flex items-center gap-4">
             <NotificationBell />
             <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
             <button 
               onClick={() => window.location.href = '/query'}
               className="hidden sm:flex items-center gap-2 bg-[#007AFF] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-600 transition shadow-sm shadow-blue-200"
             >
               <Sparkles className="w-4 h-4" /> AI Research
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 space-y-8">
        
        {/* --- Page Title Area --- */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Market Overview</h1>
            <p className="text-gray-500 mt-1">Your personal financial command center.</p>
          </div>
          
          {/* Mobile "Add" Button (visible only on small screens) */}
          <button 
            onClick={() => window.location.href = '/query'}
            className="sm:hidden w-full bg-black text-white py-3 rounded-2xl font-semibold flex justify-center items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" /> Add New Asset
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* --- MAIN SECTION: WATCHLIST --- */}
          <div className="lg:col-span-2 apple-card overflow-hidden min-h-[500px]">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-gray-400" /> Watchlist
              </h2>
            </div>

            {data?.watchlist?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase font-semibold bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 pl-8">Symbol</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Today</th>
                      <th className="px-6 py-3 text-right pr-8">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.watchlist.map((stock) => (
                      <tr key={stock.ticker_symbol} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shadow-inner">
                              {stock.ticker_symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-base">{stock.ticker_symbol}</div>
                              <div className="text-xs text-gray-500 font-medium">{stock.company_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 text-base">
                            ${Number(stock.current_price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                            stock.price_change_percent >= 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                             {stock.price_change_percent >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                             {Math.abs(stock.price_change_percent).toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right pr-8">
                          <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openAlertModal(stock.ticker_symbol, stock.current_price)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Set Alert"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => removeFromWatchlist(stock.ticker_symbol)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No assets yet</h3>
                <p className="text-gray-500 max-w-sm mb-8">
                  Use our AI-powered search to find the best stocks for your portfolio.
                </p>
                <button 
                  onClick={() => window.location.href = '/query'}
                  className="apple-button"
                >
                  Start Researching
                </button>
              </div>
            )}
          </div>

          {/* --- SIDEBAR: RECENT AI SEARCHES --- */}
          <div className="space-y-6">
            <div className="apple-card p-6 h-fit">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Recent AI Insights
              </h3>
              <div className="space-y-3">
                {data?.recentQueries?.map((q, i) => (
                  <div key={i} className="group p-3.5 rounded-2xl bg-gray-50 hover:bg-blue-50 cursor-pointer transition-all border border-transparent hover:border-blue-100 active:scale-95">
                    <p className="text-sm text-gray-700 font-medium group-hover:text-blue-700 line-clamp-2 leading-relaxed">
                      "{q}"
                    </p>
                  </div>
                ))}
                {data?.recentQueries?.length === 0 && (
                   <p className="text-sm text-gray-400 italic text-center py-8">No search history.</p>
                )}
              </div>
            </div>
            
            {/* Promo Card */}
            <div className="relative overflow-hidden rounded-3xl shadow-xl bg-black text-white p-6">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl opacity-50"></div>
              <h4 className="font-bold text-lg mb-2 relative z-10">Smart Alerts</h4>
              <p className="text-sm text-gray-300 mb-4 relative z-10 leading-relaxed">
                Never miss a beat. Set custom P/E and price targets by clicking the bell icon on any stock.
              </p>
            </div>
          </div>

        </div>
      </div>

      <AlertModal 
        isOpen={isAlertOpen} 
        onClose={() => setIsAlertOpen(false)}
        ticker={selectedStock.ticker}
        currentPrice={selectedStock.price}
      />
    </div>
  );
}