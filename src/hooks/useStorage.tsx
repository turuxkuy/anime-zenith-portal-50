
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type FileType = 'poster' | 'backdrop' | 'thumbnail' | 'video';

interface UploadOptions {
  fileName?: string;
  fileType?: FileType;
  folderPath?: string;
  onProgress?: (progress: number) => void;
}

export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getBucketForFileType = (fileType: FileType): string => {
    switch (fileType) {
      case 'poster':
        return 'posters';
      case 'backdrop':
        return 'backdrops';
      case 'thumbnail':
        return 'thumbnails';
      case 'video':
        return 'videos';
      default:
        return 'posters';
    }
  };

  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<string | null> => {
    const {
      fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`,
      fileType = 'poster',
      folderPath = '',
      onProgress,
    } = options;

    const bucket = getBucketForFileType(fileType);
    let filePath = fileName;
    
    if (folderPath) {
      filePath = `${folderPath}/${fileName}`;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setUploading(false);
      setProgress(100);
      
      if (onProgress) {
        onProgress(100);
      }

      return publicUrlData.publicUrl;
    } catch (err: any) {
      setUploading(false);
      console.error('Error uploading file:', err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload file",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteFile = async (url: string): Promise<boolean> => {
    // Extract the bucket and path from the URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Format is usually /storage/v1/object/public/bucket-name/path
      if (pathParts.length >= 6) {
        const bucket = pathParts[5];
        const path = pathParts.slice(6).join('/');
        
        const { error } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (error) {
          throw error;
        }

        return true;
      }
      
      throw new Error('Invalid storage URL format');
    } catch (err: any) {
      console.error('Error deleting file:', err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete file",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  };
}
