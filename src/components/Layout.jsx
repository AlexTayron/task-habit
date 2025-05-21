import React from 'react';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <motion.main 
        className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <footer className="text-center py-6 text-muted-foreground text-xs border-t border-border/30">
        <p>© {new Date().getFullYear()} TaskHabit. Sua vida, organizada e vibrante.</p>
        <p>Criado por Alex Tayron ✨</p>
      </footer>
      <Toaster />
    </div>
  );
};

export default Layout;