import { useState } from 'react';

import { toast } from 'sonner';

import type { TAllMusic } from '@documenso/lib/types/allMusic';
import { trpc } from '@documenso/trpc/react';

import { useAllMusicLinksStore } from '~/storage/store-allmusic-links';

export interface AllMusicRecord {
  id?: number;
  title: string;
  isrcVideo?: string | null;
  isrcSong?: string | null;
  UPC?: string | null;
  publishedAt?: Date | null;
  catalog?: string | null;
  artists?: Array<{ id: number; name: string }>;
  agregadora?: { id: number; name: string } | null;
  recordLabel?: { id: number; name: string } | null;
  distribuidor?: { id: number; name: string } | null;
  videoLinks?: Array<{
    id: number;
    name: string;
    url: string;
    isrcVideo?: string | null | undefined;
    publishedAt?: Date | null | undefined;
    lyrics?: string | null | undefined;
  }>;
  generalLinks?: Array<{
    id: number;
    name: string;
    url: string;
  }>;
}

export const useAllMusic = () => {
  const utils = trpc.useUtils();
  const { videoLinks, generalLinks, resetStore } = useAllMusicLinksStore();

  const [editingRecord, setEditingRecord] = useState<TAllMusic | null>(null);

  // Create mutation
  const createMutation = trpc.allMusic.createAllMusic.useMutation({
    onSuccess: async () => {
      toast.dismiss();

      await utils.allMusic.findAllMusic.invalidate();
      resetStore();
      toast.success('Music record created successfully');
    },
    onMutate: () => {
      toast.loading('Creating music record...');
    },
    onError: (error) => {
      toast.dismiss();

      toast.error(`Failed to create record: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = trpc.allMusic.updateAllMusic.useMutation({
    onSuccess: async () => {
      toast.dismiss();
      await utils.allMusic.findAllMusic.invalidate();
      resetStore();
      toast.success('Music record updated successfully');
    },
    onMutate: () => {
      toast.dismiss();

      toast.loading('Updating music record...');
    },
    onError: (error) => {
      toast.dismiss();

      toast.error(`Failed to update record: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.allMusic.deleteMultipleByIds.useMutation({
    onSuccess: async () => {
      toast.dismiss();
      await utils.allMusic.findAllMusic.invalidate();
      toast.success('Music record deleted successfully');
    },
    onMutate: () => {
      toast.loading('Deleting music record...');
    },
    onError: (error) => {
      toast.dismiss();

      toast.error(`Failed to delete record: ${error.message}`);
    },
  });

  const handleCreate = async (
    data: Omit<TAllMusic, 'id' | 'createdAt' | 'updatedAt' | 'recordLabelId'>,
  ) => {
    try {
      await createMutation.mutateAsync({
        title: data.title,
        isrcVideo: data.isrcVideo ?? undefined,
        isrcSong: data.isrcSong ?? undefined,
        UPC: data.UPC ?? undefined,
        publishedAt: data.publishedAt ?? undefined,
        catalog: data.catalog ?? undefined,
        artists: data.artists?.map((artist) => artist.name) || [],
        agregadoraId: data.agregadora?.id,
        recordLabelId: data.recordLabel?.id,
        videoLinks: videoLinks
          .filter((link) => !link.deleted)
          .map((link) => ({
            name: link.name,
            url: link.url,
            isrcVideo: link.isrcVideo,
            publishedAt: link.publishedAt,
            lyrics: link.lyrics,
          })),
        generalLinks: generalLinks
          .filter((link) => !link.deleted)
          .map((link) => ({
            name: link.name,
            url: link.url,
          })),
      });
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleUpdate = async (
    data: Omit<TAllMusic, 'createdAt' | 'updatedAt' | 'recordLabelId'>,
  ) => {
    if (!data.id) return;

    try {
      console.log('Updating links:', videoLinks);
      await updateMutation.mutateAsync({
        id: data.id,
        title: data.title,
        isrcVideo: data.isrcVideo ?? undefined,
        isrcSong: data.isrcSong ?? undefined,
        UPC: data.UPC ?? undefined,
        publishedAt: data.publishedAt ?? undefined,
        catalog: data.catalog ?? undefined,
        artists: data.artists?.map((artist) => artist.name) || [],
        agregadoraId: data.agregadora?.id,
        recordLabelId: data.recordLabel?.id,
        videoLinks: videoLinks.map((link) => ({
          id: isNaN(Number(link.id)) ? undefined : Number(link.id),
          name: link.name,
          url: link.url,
          isrcVideo: link.isrcVideo,
          publishedAt: link.publishedAt,
          lyrics: link.lyrics,
          deleted: link.deleted,
          modified: link.modified,
        })),
        generalLinks: generalLinks.map((link) => ({
          id: isNaN(Number(link.id)) ? undefined : Number(link.id),
          name: link.name,
          url: link.url,
          deleted: link.deleted,
        })),
      });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ ids: [id] });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    editingRecord,
    setEditingRecord,
  };
};
