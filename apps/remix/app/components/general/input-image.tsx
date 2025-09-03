import { type ChangeEvent, useEffect, useRef, useState } from 'react';

import { Eye, Trash2Icon, Upload } from 'lucide-react';

import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

type InputImageProps = {
  image?: string;
  imagesDb?: ImageFile[];
  onUpload?: (file: File | null) => void;
  onMultipleUpload?: (files: File[]) => void;
  multiple: boolean;
  setIsImageRemove?: (remove: boolean) => void;
};

export default function InputImage({
  image,
  imagesDb,
  onUpload,
  onMultipleUpload,
  setIsImageRemove,
  multiple = true,
}: InputImageProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (imagesDb) {
      setImages(imagesDb);
    } else if (image) {
      setImages([
        {
          file: new File([], image), // Create a dummy file object
          preview: image,
          id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        },
      ]);
    }
  }, [imagesDb, image]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Verificar límite de 2 imágenes
    const currentImageCount = images.length;
    const maxImages = 2;
    const remainingSlots = maxImages - currentImageCount;

    if (remainingSlots <= 0) {
      alert('Ya has alcanzado el límite máximo de 2 imágenes');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: ImageFile[] = [];

    filesToProcess.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          if (onUpload) {
            onUpload(file);
          } else if (onMultipleUpload) {
            onMultipleUpload([...images.map((img) => img.file), ...filesToProcess]);
          }
          if (multiple) {
            newImages.push({
              file,
              preview,
              id: Math.random().toString(36).substr(2, 9),
            });

            if (newImages.length === filesToProcess.length) {
              setImages((prev) => [...prev, ...newImages]);
            }
          } else {
            setImages([
              {
                file,
                preview,
                id: Math.random().toString(36).substr(2, 9),
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (id: string) => {
    if (onUpload) {
      onUpload(null);
      setIsImageRemove?.(true);
    } else if (onMultipleUpload) {
      const filesToRemove = images.filter((img) => img.id !== id).map((img) => img.file);
      onMultipleUpload(filesToRemove);
    }
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearAll = () => {
    if (onUpload) {
      onUpload(null);
      setIsImageRemove?.(true);
    } else if (onMultipleUpload) {
      onMultipleUpload([]);
    }
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mx-auto w-full space-y-4">
      <div className="space-y-2">
        <div className="flex w-full flex-col items-center gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            className={`flex w-full flex-1 items-center bg-transparent ${images.length > 0 ? 'justify-between' : 'justify-center'}`}
            disabled={images.length >= 2}
          >
            <Upload className="mr-2 h-4 w-4" />

            <div className="flex w-full items-center justify-center">
              {images.length < 1 && <span>Upload</span>}
              {images.length > 0 && (
                <Badge
                  variant="secondary"
                  className="flex w-full items-center justify-center text-center"
                >
                  {images.length} / 2 file{images.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {images.length < 1 && <Upload className="mr-2 h-4 w-4 text-transparent" />}
          </Button>

          {images.length > 0 && (
            <div className="flex w-full items-center gap-2 sm:w-fit">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-fit">
                    <Eye className="h-4 w-4 sm:mr-1 sm:w-fit" />
                    Preview
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  className={`z-9999 mt-1 p-2 ${multiple ? 'w-80' : 'w-52'}`}
                >
                  <div className="space-y-3">
                    {/* <div className="flex items-center justify-between">
                      <h4 className="font-medium">Image Preview</h4>
                      <Badge variant="secondary">{images.length} images</Badge>
                    </div> */}
                    <div
                      className={`grid max-h-64 ${multiple ? 'grid-cols-2' : 'grid-cols-1'} gap-2 overflow-y-auto overflow-x-hidden p-1`}
                    >
                      {images.map((image) => (
                        <div key={image.id} className="group relative">
                          <img
                            src={image.preview || '/placeholder.svg'}
                            alt={image.file.name}
                            width={120}
                            height={120}
                            className="h-20 w-full rounded-md border object-cover"
                          />
                          <button
                            onClick={() => removeImage(image.id)}
                            className="bg-backgroundDark border-border absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-sm border-[1px] text-xs text-red-600 opacity-0 transition-colors hover:border-red-600 hover:text-red-700 group-hover:opacity-100"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 truncate rounded-b-md bg-black/50 p-1 text-xs text-white">
                            {image.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={clearAll}
                size={'default'}
                className="bg-transparent p-3 text-red-600 hover:text-red-700"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          max={2}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
