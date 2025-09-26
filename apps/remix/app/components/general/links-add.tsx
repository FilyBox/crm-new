import { useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { LinkIcon, PlusIcon, Trash2Icon, VideoIcon } from 'lucide-react';

import { cn } from '@documenso/ui/lib/utils';
import { badgeVariants } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Card } from '@documenso/ui/primitives/card';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';
import { Textarea } from '@documenso/ui/primitives/textarea';

import { useAllMusicLinksStore } from '~/storage/store-allmusic-links';

export default function LinksAdd({ isLoading }: { isLoading: boolean; editar: boolean }) {
  const {
    videoLinks,
    generalLinks,
    addVideoLink,
    addGeneralLink,
    updateVideoLink,
    updateGeneralLink,
    removeVideoLink,
    removeGeneralLink,
  } = useAllMusicLinksStore();
  const { t } = useLingui();
  const [activeTab, setActiveTab] = useState<'video' | 'general'>('video');

  const visibleVideoLinks = videoLinks.filter((link) => !link.deleted);
  const visibleGeneralLinks = generalLinks.filter((link) => !link.deleted);
  const totalLinks = visibleVideoLinks.length + visibleGeneralLinks.length;

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={
            totalLinks > 0
              ? cn(
                  badgeVariants({
                    variant: 'secondary',
                    size: 'default',
                    className: 'w-full hover:!bg-blue-100 hover:dark:!bg-blue-400/20',
                  }),
                )
              : `bg-background w-full p-1`
          }
        >
          {totalLinks > 0 ? (
            <div className="flex items-center gap-2">
              <LinkIcon size={16} />
              <span className="text-xs font-medium">
                {totalLinks} <Trans>Link{totalLinks > 1 ? 's' : ''}</Trans>
              </span>
            </div>
          ) : (
            <PlusIcon size={16} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-9999 flex h-full min-h-[50vh] w-full flex-col-reverse overflow-hidden sm:min-w-[50cqw]"
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'video' | 'general')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <VideoIcon size={16} />
              <Trans>Video Links</Trans> ({visibleVideoLinks.length})
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <LinkIcon size={16} />
              <Trans>General Links</Trans> ({visibleGeneralLinks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-4">
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="default"
                onClick={() =>
                  addVideoLink({
                    id: crypto.randomUUID(),
                    name: '',
                    url: '',
                    isrcVideo: '',
                    publishedAt: undefined,
                    lyrics: '',
                    modified: false,
                  })
                }
                className="w-full"
                disabled={isLoading}
              >
                <Trans>Add Video Link</Trans> <PlusIcon size={16} className="ml-2" />
              </Button>

              <ScrollArea className="h-[50cqh] !max-h-[50cqh] !w-full pr-4">
                <div className="flex w-full flex-col gap-4">
                  <AnimatePresence>
                    {visibleVideoLinks.map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              <Trans>Video Link</Trans> #{index + 1}
                            </h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => updateVideoLink(link.id, { deleted: true })}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                              disabled={isLoading}
                            >
                              <Trash2Icon size={12} />
                            </Button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor={`video-name-${link.id}`}>
                                <Trans>Title</Trans> *
                              </Label>
                              <Input
                                id={`video-name-${link.id}`}
                                value={link.name}
                                onChange={(e) => updateVideoLink(link.id, { name: e.target.value })}
                                placeholder={t`Title`}
                                disabled={isLoading}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor={`video-url-${link.id}`}>
                                <Trans>URL</Trans> *
                              </Label>
                              <Input
                                id={`video-url-${link.id}`}
                                value={link.url}
                                onChange={(e) => updateVideoLink(link.id, { url: e.target.value })}
                                placeholder="https://..."
                                disabled={isLoading}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor={`video-isrc-${link.id}`}>
                                <Trans>ISRC Video</Trans>
                              </Label>
                              <Input
                                id={`video-isrc-${link.id}`}
                                value={link.isrcVideo || ''}
                                onChange={(e) =>
                                  updateVideoLink(link.id, { isrcVideo: e.target.value })
                                }
                                placeholder="USRC17607839"
                                disabled={isLoading}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`video-published-${link.id}`}>
                                <Trans>Published Date</Trans>
                              </Label>
                              <Input
                                id={`video-published-${link.id}`}
                                type="date"
                                value={
                                  link.publishedAt
                                    ? link.publishedAt.toISOString().split('T')[0]
                                    : ''
                                }
                                onChange={(e) =>
                                  updateVideoLink(link.id, {
                                    publishedAt: e.target.value
                                      ? new Date(e.target.value)
                                      : undefined,
                                  })
                                }
                                disabled={isLoading}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Label htmlFor={`video-lyrics-${link.id}`}>
                                <Trans>Lyrics</Trans>
                              </Label>
                              <Textarea
                                id={`video-lyrics-${link.id}`}
                                value={link.lyrics || ''}
                                onChange={(e) =>
                                  updateVideoLink(link.id, { lyrics: e.target.value })
                                }
                                placeholder={t`Enter lyrics here...`}
                                rows={3}
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {visibleVideoLinks.length === 0 && (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <VideoIcon size={48} className="mx-auto mb-4 opacity-50" />
                      <p>
                        <Trans>No video links added yet</Trans>
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="general" className="mt-4">
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="default"
                onClick={() =>
                  addGeneralLink({
                    id: crypto.randomUUID(),
                    name: '',
                    url: '',
                  })
                }
                className="w-full"
                disabled={isLoading}
              >
                <Trans>Add General Link</Trans> <PlusIcon size={16} className="ml-2" />
              </Button>

              <ScrollArea className="h-[50cqh] !max-h-[50cqh] !w-full pr-4">
                <div className="flex w-full flex-col gap-4">
                  <AnimatePresence>
                    {visibleGeneralLinks.map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              <Trans>General Link</Trans> #{index + 1}
                            </h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGeneralLink(link.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                              disabled={isLoading}
                            >
                              <Trash2Icon size={12} />
                            </Button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor={`general-name-${link.id}`}>
                                <Trans>Title</Trans> *
                              </Label>
                              <Input
                                id={`general-name-${link.id}`}
                                value={link.name}
                                onChange={(e) =>
                                  updateGeneralLink(link.id, { name: e.target.value })
                                }
                                placeholder={t`Title`}
                                disabled={isLoading}
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor={`general-url-${link.id}`}>
                                <Trans>URL</Trans> *
                              </Label>
                              <Input
                                id={`general-url-${link.id}`}
                                value={link.url}
                                onChange={(e) =>
                                  updateGeneralLink(link.id, { url: e.target.value })
                                }
                                placeholder="https://..."
                                disabled={isLoading}
                                required
                              />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {visibleGeneralLinks.length === 0 && (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <LinkIcon size={48} className="mx-auto mb-4 opacity-50" />
                      <p>
                        <Trans>No general links added yet</Trans>
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
