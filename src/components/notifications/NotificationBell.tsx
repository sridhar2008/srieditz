import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  formatStudioDate,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '../../services/studioService';
import { StudioNotification } from '../../types/studio';

export const NotificationBell: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<StudioNotification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const targetId = isAdmin ? 'admin' : user.uid;
    const unsub = subscribeNotifications(targetId, setItems);
    return () => unsub();
  }, [user, isAdmin]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  if (!user) return null;

  const unreadCount = items.filter((i) => !i.read).length;

  const handleOpenItem = async (item: StudioNotification) => {
    if (!item.read) {
      await markNotificationRead(item.id);
    }
    setOpen(false);
    if (item.projectId) {
      navigate(isAdmin ? `/admin?project=${item.projectId}` : `/dashboard?project=${item.projectId}`);
    } else {
      navigate(isAdmin ? '/admin' : '/dashboard');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#111115] border border-zinc-800 shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllNotificationsRead(items)}
                className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/70">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No notifications yet.
              </div>
            ) : (
              items.slice(0, 15).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleOpenItem(item)}
                  className={`w-full text-left px-4 py-3 hover:bg-zinc-900/70 transition-colors cursor-pointer ${
                    !item.read ? 'bg-[#D4AF37]/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold ${!item.read ? 'text-[#D4AF37]' : 'text-zinc-200'}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-zinc-500 whitespace-nowrap tabular-nums">
                      {formatStudioDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{item.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
