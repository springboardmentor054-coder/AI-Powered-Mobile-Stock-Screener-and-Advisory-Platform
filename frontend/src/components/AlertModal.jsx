import { useState, useEffect } from 'react';
import { X, Bell, Activity, Trash2, RotateCcw, CheckCircle2, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AlertModal({ isOpen, onClose, ticker, currentPrice }) {
  const [metric, setMetric] = useState('current_price');
  const [operator, setOperator] = useState('>');
  // Initialize with currentPrice if available, otherwise empty string
  const [value, setValue] = useState(currentPrice ? String(currentPrice) : '');
  const [loading, setLoading] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState([]);

  useEffect(() => {
    if (isOpen && ticker) {
      fetchAlerts();
      // Reset value when opening for a new stock
      setValue(currentPrice ? String(currentPrice) : '');
    }
  }, [isOpen, ticker, currentPrice]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get(`/alerts/stock/${ticker}`);
      setExistingAlerts(res.data);
    } catch (err) { console.error("Failed to load alerts"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/alerts/create', { ticker, metric, operator, value: Number(value) });
      toast.success(`Alert set for ${ticker}`);
      fetchAlerts();
    } catch (err) {
      toast.error("Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (id) => {
    try {
      await api.put(`/alerts/${id}/reactivate`);
      setExistingAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACTIVE' } : a));
      toast.success("Alert Reactivated!");
    } catch (err) { toast.error("Failed"); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/alerts/${id}`);
      setExistingAlerts(prev => prev.filter(a => a.id !== id));
      toast.success("Alert Deleted");
    } catch (err) { toast.error("Failed"); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-fade-in scale-100 transition-all flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Alerts for {ticker}
            </h3>
            <p className="text-sm text-gray-500">Manage your tracking rules</p>
          </div>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* SECTION 1: CREATE NEW */}
          <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Activity className="w-4 h-4 text-blue-500" /> Create New Rule
            </h4>

            <div className="grid grid-cols-2 gap-4">
               {/* Custom Styled Select 1 */}
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Metric</label>
                 <div className="relative">
                   <select 
                     value={metric} onChange={(e) => setMetric(e.target.value)} 
                     className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow cursor-pointer"
                   >
                     <option value="current_price">Price</option>
                     <option value="pe_ratio">P/E Ratio</option>
                     <option value="revenue_growth">Growth</option>
                   </select>
                   {/* Custom Chevron */}
                   <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                 </div>
               </div>

               {/* Custom Styled Select 2 */}
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Condition</label>
                 <div className="relative">
                    <select 
                      value={operator} onChange={(e) => setOperator(e.target.value)} 
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow cursor-pointer"
                    >
                      <option value=">">Above</option>
                      <option value="<">Below</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                 </div>
               </div>
            </div>

            {/* Input Field Fixed */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Target Value</label>
              <div className="relative group">
                <input 
                  type="number" 
                  step="any" 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-lg font-mono text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="0.00"
                />
                <span className="absolute left-3 top-3.5 text-gray-400 font-medium group-focus-within:text-blue-500 transition-colors">$</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-black transition-transform active:scale-95 shadow-md disabled:opacity-70 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Set Alert'}
            </button>
          </form>

          {/* SECTION 2: EXISTING ALERTS */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Bell className="w-4 h-4 text-gray-400" /> Active & History
            </h4>

            <div className="space-y-3">
              {existingAlerts.length > 0 ? (
                existingAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 transition shadow-sm group">
                    
                    {/* Alert Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 capitalize text-sm">
                          {alert.metric_column.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded-md font-medium border border-gray-200">
                           {alert.operator} {alert.threshold_value}
                        </span>
                      </div>
                      
                      {/* STATUS BADGE */}
                      <div className="flex items-center gap-2">
                        {alert.status === 'ACTIVE' ? (
                          <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-green-100">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-100">
                            <CheckCircle2 className="w-3 h-3" /> TRIGGERED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                      {alert.status === 'TRIGGERED' && (
                        <button 
                          onClick={() => handleReactivate(alert.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Reactivate"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No alerts set for {ticker} yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}