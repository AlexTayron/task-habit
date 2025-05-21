import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Repeat, Sparkles, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tarefas', icon: ListChecks },
  { href: '/habits', label: 'Hábitos', icon: Repeat },
  { href: '/todos', label: 'To-Dos', icon: ListChecks },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, showToast, user, userName } = useAppContext();

  const handleLogout = () => {
    logout();
    navigate('/login');
    showToast("Até mais! 👋", "Logout realizado com sucesso.");
  };

  return (
    <nav className="bg-card/60 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity duration-300">
            <Sparkles size={36} className="transform text-primary animate-pulse" />
            <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
              TaskHabit
            </span>
          </Link>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              {navItems.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden sm:block"
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out group",
                      location.pathname === item.href
                        ? "bg-primary/20 text-primary shadow-inner"
                        : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <item.icon size={18} className={cn(
                      "transition-colors", 
                      location.pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://source.unsplash.com/random/100x100/?portrait" alt="Avatar do usuário" />
                      <AvatarFallback><UserCircle/></AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName || user?.email?.split('@')[0] || 'Usuário'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || ''}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* Mobile nav items */}
                  {navItems.map((item) => (
                     <DropdownMenuItem key={`mobile-${item.href}`} asChild className="sm:hidden">
                       <Link to={item.href} className={cn("flex items-center w-full", location.pathname === item.href ? "bg-primary/10 text-primary" : "")}>
                         <item.icon className="mr-2 h-4 w-4" />
                         <span>{item.label}</span>
                       </Link>
                     </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center w-full">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:!bg-red-500/10 hover:!text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;