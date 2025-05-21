import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { motion } from 'framer-motion';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup, handleGoogleAuth, showToast } = useAppContext();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Erro", "Por favor, insira seu nome.", "destructive");
      return;
    }
    if (!email || !password) {
      showToast("Campos incompletos", "Por favor, preencha todos os campos.", "destructive");
      return;
    }
    setLoading(true);
    const success = await signup(email, password, name);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };
  
  const handleGoogleSignup = async () => {
    setLoading(true);
    const success = await handleGoogleAuth();
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 p-4">
      <Card className="w-full max-w-md glassmorphic-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Insira seus dados para criar sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Seu nome" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="exemplo@email.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-3 font-semibold" disabled={loading}>
                {loading ? 'Criando...' : <><UserPlus className="mr-2 h-5 w-5"/> Criar Conta</>}
              </Button>
            </motion.div>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou</span>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="w-full flex items-center gap-2 border-accent/50 text-accent hover:bg-accent/10 hover:text-accent" onClick={handleGoogleSignup} disabled={loading}>
               <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.001 4.555c2.437 0 4.045 1.014 4.901 1.864l3.297-3.297C17.575 2.012 15.05 0 12.001 0c-4.424 0-8.28 2.944-9.606 7.06zm0 2.603c-1.892 0-3.516 1.044-4.383 2.456l-3.48-3.48C2.231 4.112 4.512 2.555 7.06 2.555c2.438 0 4.046 1.014 4.902 1.864zm0 4.815c-.867 0-1.734.256-2.527.768l-3.482-3.482A6.693 6.693 0 0 0 4.942 12a6.694 6.694 0 0 0 3.481 3.482l3.481-3.482c-.793-.512-1.66-1.024-2.527-1.024zm.001 7.06c-1.892 0-3.516-1.044-4.383-2.456l-3.48-3.48c-.867 1.412-1.634 3.168-1.634 4.936A11.988 11.988 0 0 0 12.001 24c4.425 0 8.28-2.944 9.606-7.06h-3.546c-1.326 1.634-2.95 2.732-6.06 2.732z"></path></svg>
              Entrar com Google
            </Button>
          </motion.div>
        </CardContent>
        <CardFooter className="text-center text-sm mt-4">
          Já tem uma conta?{' '}
          <Link to="/login" className="underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;