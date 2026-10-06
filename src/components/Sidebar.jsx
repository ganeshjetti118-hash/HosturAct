import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { listActiveActivities } from '@/lib/activityApi';
import { supabase } from '@/lib/supabaseClient';
import { LayoutDashboard, Plus, Radio, Loader2, X } from 'lucide-react';

function NavItem({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
      isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`

      }>
      
      <Icon size={16} />
      {label}
    </NavLink>);

}

export default function Sidebar({ onNavigate }) {
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await listActiveActivities();
        if (alive) setActive(data);
      } catch {if (alive) setActive([]);}
      if (alive) setLoading(false);
    }
    load();
    const channel = supabase.channel('active-activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="px-6 h-16 flex items-center justify-between border-b border-border shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-baseline gap-2.5">
          <span className="font-display text-xl font-bold tracking-tightest text-foreground">HosturAct</span>
        </Link>
        {onNavigate &&
        <button onClick={onNavigate} className="lg:hidden text-muted-foreground hover:text-foreground"><X size={18} /></button>
        }
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">Navigate</p>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end onClick={onNavigate} />
          <NavItem to="/quiz/new" icon={Plus} label="New Activity" onClick={onNavigate} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-1.5 flex items-center gap-1.5">
            <Radio size={11} className="text-gold" /> Live Rooms
          </p>
          {loading ?
          <div className="px-3 py-2"><Loader2 size={14} className="animate-spin text-muted-foreground" /></div> :
          active && active.length > 0 ?
          active.map((q) =>
          <NavLink
            key={q.id}
            to={`/quiz/${q.id}/room`}
            onClick={onNavigate}
            className={({ isActive }) =>
            `flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm text-sm transition-colors ${
            isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`

            }>
            
                <span className="truncate font-medium">{q.title}</span>
                
              </NavLink>
          ) :

          <p className="text-xs text-muted-foreground/70 px-3 py-1.5 italic">No active sessions</p>
          }
        </div>
      </nav>

      <div className="px-6 py-4 border-t border-border shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Precision Engine</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">v1.0 · Ivory Edition</p>
      </div>
    </div>);

}
