import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import {
  Avatar, AvatarFallback, AvatarImage
} from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from "@/components/ui/separator/separator";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User as UserIcon, Settings, Save, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAuth, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfilePage = () => {
  const { user, userName, setUserName, updateUserName } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userName || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const auth = getAuth();
  const storage = getStorage();

  useEffect(() => {
    setEditedName(userName || '');
  }, [userName]);

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedName(userName || '');
  };

  const handleSaveClick = async () => {
    if (!editedName.trim()) {
      return;
    }
    try {
      await updateUserName(editedName);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar nome no ProfilePage:", error);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedName(userName || '');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await updateProfile(auth.currentUser, { photoURL: downloadURL });
    window.location.reload();
  };

  return (
    <motion.div
      className="space-y-8 flex justify-center p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md glassmorphic-card">
        <CardHeader className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={user?.photoURL} alt={userName || 'Usuário'} />
              <AvatarFallback className="text-4xl font-semibold bg-primary text-primary-foreground">
                <UserIcon size={40} />
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-center"
                />
              ) : (
                userName || 'Usuário'
              )}
            </CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleEditClick}
            >
              <Settings className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="space-y-2">
            <Label className="text-muted-foreground">Nome:</Label>
            {isEditing ? (
              <p className="text-lg font-semibold">{editedName}</p>
            ) : (
              <p className="text-lg font-semibold">{userName || 'Não especificado'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email:</Label>
            <p className="text-lg font-semibold">{user?.email || 'Não especificado'}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Conta criada em:</Label>
            <p className="text-lg font-semibold">
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : 'Desconhecido'}
            </p>
          </div>
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={handleCancelClick}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSaveClick}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfilePage;
