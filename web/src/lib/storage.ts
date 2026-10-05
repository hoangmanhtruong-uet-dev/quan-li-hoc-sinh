import { supabase } from "./supabase";

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function uploadHomeworkFileToStorage(
  file: File
): Promise<{ name: string; url: string; size: string } | null> {
  try {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File "${file.name}" vượt quá dung lượng tối đa cho phép 10MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `homework/${fileName}`;

    // Upload file to Supabase Storage bucket 'homework-files'
    const { data, error } = await supabase.storage
      .from("homework-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    const fileSizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    if (error) {
      console.warn("Supabase Storage upload warning (using local preview fallback):", error.message);
      return {
        name: file.name,
        url: URL.createObjectURL(file),
        size: fileSizeFormatted,
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("homework-files")
      .getPublicUrl(filePath);

    return {
      name: file.name,
      url: publicUrlData.publicUrl,
      size: fileSizeFormatted,
    };
  } catch (err) {
    console.error("Failed to upload file to storage:", err);
    return null;
  }
}

export async function uploadHomeworkFilesToStorage(
  files: File[] | FileList
): Promise<{ name: string; url: string; size: string }[]> {
  const fileArray = Array.from(files);
  const uploadedResults: { name: string; url: string; size: string }[] = [];

  for (const file of fileArray) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn 10MB và sẽ bị bỏ qua.`);
      continue;
    }
    const result = await uploadHomeworkFileToStorage(file);
    if (result) {
      uploadedResults.push(result);
    }
  }

  return uploadedResults;
}

