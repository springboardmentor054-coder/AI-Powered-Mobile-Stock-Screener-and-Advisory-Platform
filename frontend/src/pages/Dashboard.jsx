import { useEffect, useState } from 'react';
import api from '../utils/api';
import AlertModal from '../components/AlertModal';
import NotificationBell from '../components/NotificationBell';
import { 
  Bookmark, ArrowUpRight, ArrowDownRight, Trash2, Search, 
  TrendingUp, Sparkles, Clock, X, BellRing, Plus, BarChart3, Check,
  RefreshCw, Sliders 
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  // 1. Split 'data' into separate states for better management
  const [watchlist, setWatchlist] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [stats, setStats] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState({ ticker: '', price: 0 });
  const [dashboardNotifications, setDashboardNotifications] = useState([]);

  useEffect(() => {
    // 2. Call the new separate fetch functions
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWatchlist(),
        fetchRecentQueries(),
        fetchRecentAlerts(),
        fetchActiveAlerts(),
        fetchStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // --- NEW: Fetch Watchlist Only ---
  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/user/watchlist');
      // Expecting res.data to be the array of items directly
      setWatchlist(res.data || []); 
    } catch (err) { console.error(err); }
  };

  // --- NEW: Fetch Recent Queries Only ---
  const fetchRecentQueries = async () => {
    try {
      const res = await api.get('/user/recent-queries');
      setRecentQueries(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchRecentAlerts = async () => {
    try {
      const res = await api.get('/alerts/notifications');
      setDashboardNotifications(Array.isArray(res.data) ? res.data.slice(0, 5) : []); 
    } catch (err) { console.error(err); }
  };

  const fetchActiveAlerts = async () => {
    try {
      const res = await api.get(`/alerts/all?t=${new Date().getTime()}`);
      setActiveAlerts(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/user/stats');
      const rawData = res.data || [];
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayLabel = days[d.getDay()];
        last7Days.push({ dateKey, dayLabel });
      }

      const filledStats = last7Days.map(day => {
        const found = rawData.find(item => item.date_group === day.dateKey);
        return {
          name: day.dayLabel,
          count: found ? parseInt(found.count) : 0
        };
      });

      setStats(filledStats);
    } catch (err) { console.error(err); }
  };

  const removeFromWatchlist = async (ticker) => {
    try {
      await api.post('/user/watchlist/remove', { ticker });
      // Update the watchlist state directly
      setWatchlist(prev => prev.filter(item => item.ticker_symbol !== ticker));
      toast.success("Asset removed");
    } catch (err) { toast.error("Failed to remove"); }
  };

  const deleteRule = async (id) => {
    try {
      await api.delete(`/alerts/${id}`);
      setActiveAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Rule deleted");
    } catch (err) { toast.error("Failed to delete rule"); }
  };

  const reactivateRule = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/reactivate`);
      setActiveAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACTIVE' } : a));
      toast.success("Alert reactivated");
    } catch (err) { toast.error("Failed to reactivate"); }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/alerts/notifications/${id}`);
      setDashboardNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Dismissed");
    } catch (err) { toast.error("Failed to dismiss"); }
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
    <div className="min-h-screen bg-[#F5F5F7] pb-20 font-sans text-[#1d1d1f]">
      
      {/* Header */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">StockOS</span>
          </div>
          <div className="flex items-center gap-5">
             <NotificationBell />
             <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>
             <button onClick={() => window.location.href = '/query'} className="hidden sm:flex items-center gap-2 bg-[#0071e3] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#0077ED] transition shadow-sm">
               <Sparkles className="w-4 h-4" /> AI Research
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 space-y-8">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Portfolio Overview</h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">Real-time market data & intelligent alerts</p>
          </div>
           <button onClick={() => window.location.href = '/query'} className="sm:hidden w-full bg-black text-white py-3 rounded-2xl font-semibold flex justify-center items-center gap-2 shadow-lg">
            <Plus className="w-5 h-5" /> Add Asset
          </button>
        </div>

        {/* --- GRID LAYOUT --- */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* 1. WATCHLIST (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-[500px]">
             <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-gray-400" /> Watchlist
              </h2>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                {/* Updated to use watchlist state */}
                {watchlist.length || 0}
              </span>
            </div>
            <div className="overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden">
               {watchlist.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase font-semibold bg-gray-50/30 sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="px-8 py-3">Symbol</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3 text-right">Change</th>
                      <th className="px-8 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {watchlist.map((stock) => (
                      <tr key={stock.ticker_symbol} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-4 font-bold text-gray-900">{stock.ticker_symbol}</td>
                        <td className="px-6 py-4 font-medium">${Number(stock.current_price).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${stock.price_change_percent >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                             {stock.price_change_percent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                             {Math.abs(stock.price_change_percent).toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openAlertModal(stock.ticker_symbol, stock.current_price)} className="text-gray-400 hover:text-blue-600"><BellRing className="w-4 h-4" /></button>
                            <button onClick={() => removeFromWatchlist(stock.ticker_symbol)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="p-8 text-center text-gray-400">Empty</div>}
            </div>
          </div>

          {/* 2. ALERTS LIST */}
          <div className="lg:col-span-4 bg-white rounded-[24px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-500" /> Your Alerts
              </h2>
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                {activeAlerts.length}
              </span>
            </div>
            
            <div className="overflow-y-auto flex-grow p-6 space-y-3 [&::-webkit-scrollbar]:hidden">
               {activeAlerts.length > 0 ? (
                 activeAlerts.map((alert) => (
                   <div key={alert.id} className="relative p-4 rounded-2xl bg-[#F9F9F9] border border-gray-100 group hover:border-blue-100 transition-all">
                      <div className="flex justify-between items-start mb-1">
                         <span className="font-bold text-gray-900">{alert.ticker_symbol}</span>
                         
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                           alert.status === 'ACTIVE' 
                             ? 'bg-green-100 text-green-700' 
                             : 'bg-orange-100 text-orange-700'
                         }`}>
                           {alert.status}
                         </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 font-medium mb-1">
                        {alert.metric_column.replace(/_/g, ' ')}
                      </div>
                      
                      <div className="text-sm font-mono text-gray-800">
                        {alert.operator} <span className="font-bold">{alert.threshold_value}</span>
                      </div>

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {alert.status !== 'ACTIVE' && (
                           <button 
                             onClick={() => reactivateRule(alert.id)}
                             title="Reactivate"
                             className="p-1.5 bg-white shadow-sm rounded-full text-green-600 hover:bg-green-50"
                           >
                             <RefreshCw className="w-3.5 h-3.5" />
                           </button>
                         )}
                         
                         <button 
                           onClick={() => deleteRule(alert.id)}
                           title="Delete Rule"
                           className="p-1.5 bg-white shadow-sm rounded-full text-red-500 hover:bg-red-50"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                     <BellRing className="w-6 h-6 text-gray-300" />
                   </div>
                   <p className="text-gray-500 text-sm">No alerts set.</p>
                 </div>
               )}
            </div>
          </div>

          {/* 3. ACTIVITY CHART */}
          <div className="lg:col-span-8 bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 h-[400px]">
            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" /> Research Activity (7 Days)
            </h3>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9CA3AF', fontSize: 12}} 
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === stats.length - 1 ? '#18181B' : '#E4E4E7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. RECENT QUERIES */}
          <div className="lg:col-span-4 bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 h-[400px] flex flex-col">
             <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" /> Recent Queries
            </h3>
            <div className="overflow-y-auto pr-2 flex-grow [&::-webkit-scrollbar]:hidden">
               <div className="space-y-2">
                {/* Updated to use recentQueries state */}
                {recentQueries.map((q, i) => (
                   <div key={i} className="group p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 cursor-pointer transition-all border border-transparent hover:border-blue-100/50">
                    <p className="text-sm text-gray-700 font-medium group-hover:text-[#0071e3] line-clamp-1">"{q}"</p>
                   </div>
                ))}
                {recentQueries.length === 0 && <p className="text-sm text-gray-400 italic text-center py-8">Start your first search.</p>}
               </div>
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