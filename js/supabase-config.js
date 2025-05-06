
const SUPABASE_URL = "https://eguwfitbjuzzwbgalwcx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndXdmaXRianV6endiZ2Fsd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQ4OTgsImV4cCI6MjA2MjEyMDg5OH0.nYgvViJgO67L5nNYEejoW5KajcXlryTThTzA1bvUO9k";

// Inisialisasi klien Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage helper
const supabaseStorage = {
  uploadFile: async (bucket, path, file) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      const publicURL = supabase.storage.from(bucket).getPublicUrl(data.path);
      
      return {
        data: {
          publicUrl: publicURL.data.publicUrl
        },
        error: null
      };
    } catch (err) {
      return {
        data: null,
        error: err
      };
    }
  },
  
  deleteFile: async (bucket, path) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
};
