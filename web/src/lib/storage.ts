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
      console.error("Supabase Storage upload error:", error.message);
      alert(`Không thể lưu file "${file.name}" lên Supabase Storage: ${error.message}\nVui lòng tạo Bucket 'homework-files' công khai (Public) trên Supabase Dashboard.`);
      return null;
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
  } catch (err: any) {
    console.error("Failed to upload file to storage:", err);
    alert(`Lỗi upload file: ${err?.message || "Không thể kết nối đến máy chủ"}`);
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

export async function handleDownloadFile(url: string, fileName: string) {
  if (!url || url === "#") {
    alert("File không tồn tại hoặc đường dẫn không hợp lệ.");
    return;
  }

  if (url.startsWith("blob:")) {
    alert(`File "${fileName}" chỉ xem được tạm thời ở máy vừa tải lên và chưa được lưu cố định lên Cloud (do thiếu Bucket 'homework-files' trên Supabase).\nVui lòng tải lại file mới lên sau khi cài đặt Bucket.`);
    return;
  }

  try {
    // If it's a Supabase public storage URL, append ?download= for clean browser download
    if (url.includes(".supabase.co/storage/v1/object/public/")) {
      const downloadUrl = `${url}?download=${encodeURIComponent(fileName)}`;
      window.open(downloadUrl, "_blank");
      return;
    }

    // Fallback: Fetch as blob and trigger download
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP error " + res.status);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.warn("Direct fetch download fallback to window.open:", err);
    window.open(url, "_blank");
  }
}


