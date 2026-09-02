// lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validasi environment variables
if (!supabaseUrl) {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set. Storage features will not work.');
}

if (!supabaseKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Storage features will not work.');
}

// Hanya buat client jika URL dan Key tersedia
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function uploadToSupabase(
  file: File,
  path: string,
  bucket: string = 'kite-frames'
) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Check environment variables.');
  }

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error('Failed to access storage');
    }

    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      // Create bucket if not exists
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error('Failed to create storage bucket');
      }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data?.path,
      fullPath: data?.fullPath,
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

export async function deleteFromSupabase(
  path: string,
  bucket: string = 'kite-frames'
) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
}

export async function getFileUrl(
  path: string,
  bucket: string = 'kite-frames'
) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}