import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, MessageCircle } from 'lucide-react'; // MessageCircle for Google icon placeholder

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, handleGoogleAuth, showToast } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Campos incompletos", "Por favor, preencha email e senha.", "destructive");
      return;
    }
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    const success = await handleGoogleAuth();
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        className="w-full max-w-md"
      >
        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader className="text-center">
            <motion.div 
              className="mx-auto mb-4 text-primary"
              animate={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 1, repeat: Infinity, repeatType: "mirror" } }}
            >
              <LogIn size={48} />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Bem-vindo(a) de Volta!
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-1">
              Faça login no TaskHabit para continuar sua jornada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-login" className="text-foreground/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email-login" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-10 bg-input/70 border-border/50 focus:bg-input"
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login" className="text-foreground/80">Senha</Label>
                 <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password-login" 
                    type="password" 
                    placeholder="Sua senha super secreta" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-10 bg-input/70 border-border/50 focus:bg-input"
                    required 
                  />
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-3 font-semibold">
                  <LogIn className="mr-2 h-5 w-5"/> Entrar
                </Button>
              </motion.div>
            </form>
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6">
              <Button variant="outline" className="w-full border-accent/50 text-accent hover:bg-accent/10 hover:text-accent" onClick={handleGoogleLogin}>
                <MessageCircle className="mr-2 h-5 w-5" /> Google
              </Button>
            </motion.div>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2 pt-6">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2">
                Crie uma agora!
              </Link>
            </p>
            <Link to="#" className="text-xs text-accent hover:underline">
              Esqueceu sua senha?
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground/70 w-full">
        <p>© {new Date().getFullYear()} TaskHabit. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default LoginPage;