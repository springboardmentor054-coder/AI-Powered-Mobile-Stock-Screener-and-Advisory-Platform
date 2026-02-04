import { useState } from 'react';
import { X, Bell } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AlertModal({ isOpen, onClose, ticker, currentPrice }) {
  const [metric, setMetric] = useState('current_price');
  const [operator, setOperator] = useState('>');
  const [value, setValue] = useState(currentPrice || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/alerts/create', { ticker, metric, operator, value: Number(value) });
      toast.success(`Alert created for ${ticker}`);
      onClose();
    } catch (err) {
      toast.error("Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in scale-100 transition-all">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            Alert Settings
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
             <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Asset</span>
             <div className="text-2xl font-bold text-gray-900 mt-1">{ticker}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1.5">Metric</label>
               <select 
                 value={metric} 
                 onChange={(e) => setMetric(e.target.value)} 
                 className="input-field appearance-none"
               >
                 <option value="current_price">Price</option>
                 <option value="pe_ratio">P/E Ratio</option>
                 <option value="revenue_growth">Growth</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
               <select 
                 value={operator} 
                 onChange={(e) => setOperator(e.target.value)} 
                 className="input-field appearance-none"
               >
                 <option value=">">Above</option>
                 <option value="<">Below</option>
               </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Value</label>
            <div className="relative">
              <input 
                type="number" 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                className="input-field pl-8 font-mono text-lg"
                placeholder="0.00" 
              />
              <span className="absolute left-3 top-3.5 text-gray-400 font-medium">$</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100">
             Notify me when <strong>{ticker}</strong> {metric === 'current_price' ? 'price' : metric.replace('_', ' ')} goes <strong>{operator === '>' ? 'above' : 'below'}</strong> <strong>{value}</strong>.
          </div>

          <button type="submit" className="w-full btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Create Alert'}
          </button>
        </form>
      </div>
    </div>
  );
}