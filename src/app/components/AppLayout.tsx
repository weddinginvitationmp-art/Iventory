import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { supabase } from "../../lib/supabase";
import { LayoutDashboard, Package, ArrowLeftRight, LogOut, Loader2, Menu, X, BookOpen } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { name: "Tổng quan", href: "/", icon: LayoutDashboard },
    { name: "Kho hàng", href: "/inventory", icon: Package },
    { name: "Giao dịch", href: "/transactions", icon: ArrowLeftRight },
    { name: "Hướng dẫn", href: "/docs", icon: BookOpen },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-100/60">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 shadow-2xl transition-transform duration-200 ease-in-out md:translate-x-0 md:static",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <div className="flex items-center gap-2 font-semibold text-lg text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20">
              <Package className="h-5 w-5" />
            </div>
            Inventro
          </div>
          <button 
            className="ml-auto md:hidden text-slate-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-2 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10" 
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
        
        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 rounded-3xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-white truncate">{user.user_metadata?.name || user.email}</p>
            <p className="text-xs text-slate-300 truncate">{user.email}</p>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 border-white/20 text-black hover:bg-red-400 hover:text-white" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 md:hidden backdrop-blur-md">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-2 font-semibold text-lg flex items-center gap-2 text-slate-900">
            <Package className="h-5 w-5 text-sky-600" />
            Inventro
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200/70 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}