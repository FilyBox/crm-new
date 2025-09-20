import React, { useEffect, useRef } from 'react';
import { useCallback, useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpring } from 'framer-motion';
import { CalendarIcon, CalendarOff, CheckCircle2, User, Users, X } from 'lucide-react';
import { toast } from 'sonner';

import LpmMobileDetails from '../components/lpm/lpm-mobile-table-details';
import { Button } from '../primitives/button';
import { Card, CardContent, CardFooter, CardHeader } from '../primitives/card';
import { Progress as ProgressBar } from '../primitives/progress';
import type { LpmData } from '../types/tables-types';
import { Badge } from './badge';
import { Checkbox } from './checkbox';

interface ExpandibleCardProps {
  title: string;
  fileName?: string;
  isrc?: string;
  progress?: number;
  onNavegate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  status?: (string | undefined)[];
  startDate: Date | null | undefined;
  expandible?: string;
  extensionTime?: string;
  endDate?: Date;
  summary?: string;
  contributors: Array<{ name: string; image?: string }>;
  tasks?: Array<{ title: string; completed: boolean }>;
  githubStars: number;
  openIssues: number;
  link?: string;
  total?: number;
  assets?: boolean;
  canvas?: boolean;
  cover?: boolean;
  LpmData?: LpmData;
  audioWAV?: boolean;
  video?: boolean;
  from?: string;
  banners?: boolean;
  pitch?: boolean;
  EPKUpdates?: boolean;
  WebSiteUpdates?: boolean;
  Biography?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export function useExpandable(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);
  const springConfig = { stiffness: 300, damping: 30 };
  const animatedHeight = useSpring(0, springConfig);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return { isExpanded, toggleExpand, animatedHeight };
}

export function ExpandibleCard({
  title,
  progress,
  startDate,
  contributors,
  tasks,
  onNavegate,
  from,
  onEdit,
  onDelete,
  status,
  isrc,
  endDate,
  assets,
  canvas,
  cover,
  audioWAV,
  video,
  banners,
  pitch,
  EPKUpdates,
  WebSiteUpdates,
  Biography,
  expandible,
  summary,
  extensionTime,
  LpmData,
  link,
  total,
  fileName,
  isSelected = false,
  onSelectChange,
}: ExpandibleCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);
  const { i18n } = useLingui();
  const currentLanguage = i18n.locale;
  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const renderDetailComponent = () => {
    if (!isExpanded) return null;

    switch (from) {
      case 'lpm':
        return LpmData ? <LpmMobileDetails data={LpmData} /> : null;
      default:
        return <></>;
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card className="text-foreground w-full cursor-pointer transition-all duration-300 hover:shadow-lg">
      <CardHeader onClick={toggleExpand} className="pb-0">
        <div className="flex w-full items-start justify-between">
          <div className="space-y-2">
            <div className="flex gap-2">
              {onSelectChange && (
                <div onClick={handleCheckboxChange}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={onSelectChange}
                    aria-label="Select row"
                    className="translate-y-1"
                  />
                </div>
              )}
              {status &&
                status.length > 0 &&
                status.map((status, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={
                      status === 'VIGENTE'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }
                  >
                    {status}
                  </Badge>
                ))}
            </div>

            <h3 className="text-xl font-semibold">{title}</h3>

            {fileName && (
              <h4 className="text-accent-foreground text-lg font-semibold">{fileName}</h4>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent onClick={toggleExpand}>
        <div className="space-y-4">
          {progress && (
            <div className="space-y-2">
              <div className="fileName flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} className="h-2" />
            </div>
          )}

          <motion.div
            style={{ height: animatedHeight }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div ref={contentRef}>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-foreground flex items-center justify-between text-sm">
                      {expandible && (
                        <div className="flex flex-col items-start">
                          <span className="fileName">Expandible:</span>
                          <span>{expandible}</span>
                        </div>
                      )}

                      {extensionTime && (
                        <div className="flex flex-col items-start">
                          <span className="fileName">Tiempo de extensión:</span>
                          <span>{extensionTime}</span>
                        </div>
                      )}

                      {link && (
                        <a
                          href={link as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-foreground hover:underline"
                        >
                          {link}
                        </a>
                      )}
                    </div>
                    {contributors && contributors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="flex items-center text-sm font-medium">
                          <Users className="mr-2 h-4 w-4" />
                          Artistas
                        </h4>
                        {contributors.map((contributor, index) => (
                          <div key={index} className="flex flex-col gap-2">
                            <div className="flex items-center">
                              <User className="text-accent-foreground mr-2 h-4 w-4" />
                              <p>{contributor.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {total && from === 'tustreams' ? (
                      <div className="text-foreground flex items-center justify-between text-sm">
                        <span className="fileName">Total:</span>
                        <span className="text-lg">{total}</span>
                      </div>
                    ) : (
                      <></>
                    )}
                    {/* Deliverables/Assets Section */}
                    {(assets ||
                      canvas ||
                      cover ||
                      audioWAV ||
                      video ||
                      banners ||
                      pitch ||
                      EPKUpdates ||
                      WebSiteUpdates ||
                      Biography) && (
                      <div className="space-y-2">
                        <h4 className="flex items-center text-sm font-medium">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Entregables
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {assets && (
                            <Badge
                              variant={assets === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {assets ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Assets
                            </Badge>
                          )}

                          {canvas && (
                            <Badge
                              variant={canvas === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {canvas ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Canva
                            </Badge>
                          )}

                          {cover && (
                            <Badge
                              variant={cover === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {cover ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Cover
                            </Badge>
                          )}

                          {audioWAV && (
                            <Badge
                              variant={audioWAV === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {audioWAV ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Audio WAV
                            </Badge>
                          )}

                          {video && (
                            <Badge
                              variant={video === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {video ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Video
                            </Badge>
                          )}

                          {banners && (
                            <Badge
                              variant={banners === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {banners ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Banners
                            </Badge>
                          )}
                          {pitch && (
                            <Badge
                              variant={pitch === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {pitch ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Pitch
                            </Badge>
                          )}
                          {EPKUpdates !== undefined && (
                            <Badge
                              variant={EPKUpdates === true ? 'default' : 'destructive'}
                              className={`flex items-center justify-center`}
                            >
                              {EPKUpdates ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}
                              EPK Updates
                            </Badge>
                          )}
                          {WebSiteUpdates !== undefined && (
                            <Badge
                              variant={WebSiteUpdates === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {WebSiteUpdates ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Web Site Updates
                            </Badge>
                          )}
                          {Biography !== undefined && (
                            <Badge
                              variant={Biography === true ? 'default' : 'destructive'}
                              className="flex items-center justify-center"
                            >
                              {Biography ? (
                                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                              ) : (
                                <X className="mr-1 h-3 w-3 text-red-500" />
                              )}{' '}
                              Biography
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {tasks && tasks.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Recent Tasks</h4>
                        {tasks?.map((task, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="fileName">{task.title}</span>
                            {task.completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          </div>
                        ))}
                      </div>
                    )}
                    {summary && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Resumen</h4>
                        <p className="text-sm">{summary}</p>
                      </div>
                    )}
                    {renderDetailComponent()}{' '}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="text-foreground flex w-full flex-col items-center justify-between gap-2 text-sm">
          <div className="flex w-full items-center justify-between">
            {startDate ? (
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>
                  {format(startDate, 'd MMM yyyy', {
                    locale: currentLanguage === 'es' ? es : enUS,
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Sin especificar</span>
              </div>
            )}

            {isrc && (
              <div className="flex items-center">
                #<span>{isrc}</span>
              </div>
            )}
            {endDate && (
              <div className="flex items-center">
                <CalendarOff className="mr-2 h-4 w-4" />
                <span>
                  {format(endDate, 'd MMM yyyy', { locale: currentLanguage === 'es' ? es : enUS })}
                </span>
              </div>
            )}
          </div>

          {onNavegate && (
            <div className="w-full space-y-2">
              <Button size={'sm'} onClick={onNavegate} className="w-full">
                {/* <MessageSquare className="mr-2 h-4 w-4" /> */}
                <Trans>View</Trans>
              </Button>
            </div>
          )}
          {onEdit && (
            <div className="w-full space-y-2">
              <Button size={'sm'} onClick={onEdit} className="w-full">
                {/* <MessageSquare className="mr-2 h-4 w-4" /> */}
                <Trans>Edit</Trans>
              </Button>
            </div>
          )}

          {onDelete && (
            <div className="w-full space-y-2">
              {/* <Button size={'sm'} variant={'destructive'} onClick={onDelete} className="w-full">
                Delete
              </Button> */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  toast.warning('Esta acción sera permanente', {
                    description: 'Estas seguro que quieres eliminar este elemento?',
                    action: {
                      label: 'Eliminar',
                      onClick: () => onDelete(),
                    },
                    className: 'mb-24',
                  });
                }}
              >
                <Trans>Delete</Trans>
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
