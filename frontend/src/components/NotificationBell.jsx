import { useState, useEffect, useRef } from 'react';
import { Bell, TrendingUp, AlertTriangle, Trash2, Check, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch on Mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/alerts/notifications'); 
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) { console.error(err); }
  };

  // --- MARK AS READ (DB + UI) ---
  const markAsRead = async (e, id) => {
    e.stopPropagation(); // Prevent bubbling if you click the container
    try {
      // 1. Optimistic Update (Instant UI change)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // 2. Database Update
      await api.put(`/alerts/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark read");
    }
  };

  // --- DELETE (DB + UI) ---
  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      // 1. Optimistic Update (Remove from list immediately)
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Recalculate count if we deleted an unread one
      const wasUnread = notifications.find(n => n.id === id && !n.is_read);
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

      // 2. Database Update
      await api.delete(`/alerts/notifications/${id}`);
      toast.success("Notification removed");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all active:scale-90 ${
          isOpen ? 'bg-black text-white' : 'hover:bg-gray-200 text-gray-600'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF3B30] border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-[90vw] sm:w-[400px] max-w-[400px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right overflow-hidden ring-1 ring-black/5">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white/50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold tracking-wider uppercase text-white bg-blue-500 px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-2">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((note) => (
                  <div 
                    key={note.id} 
                    className={`relative p-3 rounded-2xl flex gap-3 transition-all group ${
                      !note.is_read ? 'bg-blue-50/50 hover:bg-blue-100/50' : 'hover:bg-gray-100/50'
                    }`}
                  >
                    {/* Icon Box */}
                    <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      !note.is_read ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-gray-200 text-gray-400'
                    }`}>
                       {note.title.includes('Price') ? <TrendingUp className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-16"> {/* pr-16 leaves space for buttons */}
                      <div className="flex justify-between items-start">
                         <p className={`text-sm truncate ${!note.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                           {note.title}
                         </p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5">
                        {note.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                         {new Date(note.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    {/* ACTION BUTTONS (Appear on Hover / Always visible on Mobile) */}
                    <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-gradient-to-l from-transparent to-transparent pl-2">
                      
                      {/* Mark Read Button (Only if unread) */}
                      {!note.is_read && (
                        <button 
                          onClick={(e) => markAsRead(e, note.id)}
                          className="p-1.5 bg-white text-blue-600 rounded-full shadow-sm hover:bg-blue-600 hover:text-white transition"
                          title="Mark as Read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button 
                        onClick={(e) => deleteNotification(e, note.id)}
                        className="p-1.5 bg-white text-gray-400 rounded-full shadow-sm hover:bg-red-500 hover:text-white transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No new alerts</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/50">
             <button 
               onClick={fetchNotifications}
               className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-black hover:bg-white rounded-xl transition-colors"
             >
               Refresh
             </button>
          </div>
        </div>
      )}
    </div>
  );
}