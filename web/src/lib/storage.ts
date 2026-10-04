import { supabase } from "./supabase";

export async function uploadHomeworkFileToStorage(
  file: File
): Promise<{ name: string; url: string; size: string } | null> {
  try {
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
