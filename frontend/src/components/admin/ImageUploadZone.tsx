import React, { useState } from "react";
import { uploadProductMediaApi, deleteProductMediaApi } from "../../services/adminApi";

interface ImageUploadZoneProps {
  productId?: number;
  existingImages?: { id: number; url: string; isPrimary?: boolean }[];
  onImagesChange?: (files: File[]) => void;
  onRefreshMedia?: () => void;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  productId,
  existingImages = [],
  onImagesChange,
  onRefreshMedia,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Check limit
    const totalCount = existingImages.length + selectedFiles.length + files.length;
    if (totalCount > 10) {
      setError("Maximum 10 images allowed per product.");
      return;
    }
    setError(null);

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);

    if (onImagesChange) {
      onImagesChange(newFiles);
    }
  };

  const handleRemoveLocal = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    if (onImagesChange) {
      onImagesChange(newFiles);
    }
  };

  const handleDeleteExisting = async (mediaId: number) => {
    if (!productId) return;
    try {
      setIsUploading(true);
      await deleteProductMediaApi(productId, mediaId);
      if (onRefreshMedia) onRefreshMedia();
    } catch (err: any) {
      setError(err.message || "Failed to delete image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadNow = async () => {
    if (!productId || selectedFiles.length === 0) return;
    try {
      setIsUploading(true);
      setError(null);
      await uploadProductMediaApi(productId, selectedFiles);
      setSelectedFiles([]);
      setPreviews([]);
      if (onImagesChange) onImagesChange([]);
      if (onRefreshMedia) onRefreshMedia();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        Product Images / Media (Max 10)
      </label>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Existing Server Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Uploaded Images
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                <img src={img.url} alt="Product media" className="w-full h-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteExisting(img.id)}
                  disabled={isUploading}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Delete image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New File Previews */}
      {previews.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Ready to Upload
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {previews.map((src, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveLocal(index)}
                  className="absolute top-2 right-2 bg-gray-800/80 text-white p-1 rounded-full hover:bg-gray-900 transition"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {productId && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleUploadNow}
                disabled={isUploading}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Image(s)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Dropzone */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition-colors bg-gray-50/50">
        <input
          type="file"
          id="product-images-input"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="product-images-input" className="cursor-pointer space-y-2 block">
          <div className="mx-auto h-12 w-12 text-gray-400">
            📸
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-pink-600 hover:text-pink-700">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, WEBP, GIF up to 50MB</p>
        </label>
      </div>
    </div>
  );
};
