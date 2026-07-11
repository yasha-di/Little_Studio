import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/constants";
import { ValidationError } from "@/core/errors";
import { referenceImageRepository } from "@/services/repositories";
import { newId, nowIso, type ReferenceImage, type ReferenceImageId } from "@/types";

/**
 * Reference image data access: load one by id, import one from a file.
 *
 * Imported images are stored as data URLs inside the workspace store —
 * self-contained (survives moving the file), and exactly the format the
 * provider accepts for frame guidance. Size is capped so a stray 40 MB
 * photo cannot bloat the store or the API request.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function useReferenceImage(imageId: ReferenceImageId | null) {
  return useQuery({
    queryKey: queryKeys.referenceImages.detail(imageId ?? "none"),
    queryFn: () => (imageId === null ? null : referenceImageRepository.getById(imageId)),
    enabled: imageId !== null,
  });
}

export function useImportReferenceImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ReferenceImage> => {
      if (!file.type.startsWith("image/")) {
        throw new ValidationError("Only image files can be used as frames.");
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new ValidationError("The image is larger than 8 MB — pick a smaller one.");
      }

      const dataUrl = await readAsDataUrl(file);
      const dimensions = await probeDimensions(dataUrl);

      const image: ReferenceImage = {
        id: newId<"ReferenceImageId">(),
        source: { kind: "url", url: dataUrl },
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        createdAt: nowIso(),
      };
      await referenceImageRepository.save(image);
      return image;
    },
    onSuccess: (image) => {
      queryClient.setQueryData(queryKeys.referenceImages.detail(image.id), image);
    },
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new ValidationError("The image file could not be read."));
    };
    reader.readAsDataURL(file);
  });
}

function probeDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      resolve(null);
    };
    image.src = dataUrl;
  });
}
