import { type KeyboardEvent, forwardRef, useEffect, useRef, useState } from 'react';

import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@documenso/ui/lib/utils';
import { Calendar } from '@documenso/ui/primitives/calendar';
import { Input } from '@documenso/ui/primitives/input';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Textarea } from '@documenso/ui/primitives/textarea';

type EditableTextProps<T = string> = {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  name?: string;
  variant?: 'input' | 'textarea' | 'contenteditable' | 'date' | 'select';
  placeholder?: string;
  className?: string;
  editClassName?: string;
  displayClassName?: string;
  rows?: number;
  readonly?: boolean;
  disabled?: boolean;
  autoResize?: boolean;
  dateFormat?: string;
  locale?: Locale;
  options?: Array<{ value: string; label: string }>;
};

export const EditableText = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  EditableTextProps<string> | EditableTextProps<Date>
>(
  (
    {
      value: controlledValue,
      defaultValue = '' as any,
      onChange,
      name,
      variant = 'input',
      placeholder = 'Haz doble click para editar...',
      className,
      editClassName,
      displayClassName,
      rows = 3,
      readonly = false,
      disabled = false,
      autoResize = false,
      dateFormat = 'PPP',
      locale = es,
      options = [],
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = isControlled ? controlledValue : internalValue;

    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
      if (variant === 'date' && value) {
        if (value instanceof Date) {
          return value;
        }
        const date = new Date(value as string);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    });

    useEffect(() => {
      setTempValue(value);
      if (variant === 'date' && value) {
        if (value instanceof Date) {
          setSelectedDate(value);
        } else {
          const date = new Date(value as string);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        }
      }
    }, [value, variant]);

    useEffect(() => {
      if (isEditing) {
        if (variant === 'input' && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        } else if (variant === 'textarea' && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        } else if (variant === 'contenteditable' && contentEditableRef.current) {
          contentEditableRef.current.focus();
          const range = document.createRange();
          range.selectNodeContents(contentEditableRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }, [isEditing, variant]);

    useEffect(() => {
      if (autoResize && variant === 'textarea' && textareaRef.current && isEditing) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [tempValue, autoResize, variant, isEditing]);

    const handleClick = () => {
      if (readonly || disabled) return;
      setIsEditing(true);
    };

    const handleSave = () => {
      setIsEditing(false);
      if (tempValue !== value) {
        if (!isControlled) {
          setInternalValue(tempValue);
        }
        onChange?.(tempValue);

        if (hiddenInputRef.current) {
          hiddenInputRef.current.value =
            typeof tempValue === 'string' ? tempValue : (tempValue as Date).toISOString();
          const event = new Event('change', { bubbles: true });
          hiddenInputRef.current.dispatchEvent(event);
        }
      }
    };

    const handleCancel = () => {
      setIsEditing(false);
      setTempValue(value);
      if (variant === 'date' && value) {
        const date = new Date(value as string);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    };

    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        setSelectedDate(date);
        setIsEditing(false);

        const newValue = (
          controlledValue instanceof Date || defaultValue instanceof Date
            ? date
            : date.toISOString()
        ) as any;

        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);

        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = date.toISOString();
          const event = new Event('change', { bubbles: true });
          hiddenInputRef.current.dispatchEvent(event);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && (variant === 'input' || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    const handleContentEditableInput = () => {
      if (contentEditableRef.current) {
        setTempValue(contentEditableRef.current.textContent || '');
      }
    };

    const handleSelectChange = (newValue: string) => {
      setIsEditing(false);

      if (newValue !== value) {
        if (!isControlled) {
          setInternalValue(newValue as any);
        }
        onChange?.(newValue as any);

        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = newValue;
          const event = new Event('change', { bubbles: true });
          hiddenInputRef.current.dispatchEvent(event);
        }
      }
    };

    if (variant === 'select') {
      const selectedOption = options.find((opt) => opt.value === value);
      const displayValue = selectedOption?.label || placeholder;

      if (isEditing && !readonly && !disabled) {
        return (
          <>
            {name && (
              <input
                ref={hiddenInputRef}
                type="hidden"
                name={name}
                defaultValue={typeof value === 'string' ? value : ''}
              />
            )}
            <Select
              value={value as string}
              onValueChange={handleSelectChange}
              open={isEditing}
              onOpenChange={(open) => {
                if (!open) {
                  setIsEditing(false);
                }
              }}
            >
              <SelectTrigger className={cn('w-full', editClassName, className)}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        );
      }

      return (
        <>
          {name && (
            <Input
              ref={hiddenInputRef}
              type="hidden"
              name={name}
              defaultValue={typeof value === 'string' ? value : ''}
            />
          )}
          <div
            onClick={handleClick}
            className={cn(
              readonly || disabled ? 'cursor-default' : 'cursor-pointer',
              'flex min-h-[2.5rem] items-center rounded px-3 py-2 transition-colors',
              !readonly && !disabled && 'hover:bg-muted/50',
              disabled && 'opacity-50',
              !selectedOption && 'text-muted-foreground italic',
              displayClassName,
              className,
            )}
          >
            <span>{displayValue}</span>
          </div>
        </>
      );
    }

    if (variant === 'date') {
      const displayValue = selectedDate
        ? format(selectedDate, dateFormat, { locale })
        : placeholder;

      return (
        <>
          {name && (
            <Input
              ref={hiddenInputRef}
              type="hidden"
              name={name}
              defaultValue={selectedDate ? selectedDate.toISOString() : ''}
            />
          )}
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <div
                onClick={handleClick}
                className={cn(
                  readonly || disabled ? 'cursor-default' : 'cursor-pointer',
                  'flex min-h-[2.5rem] items-center gap-2 rounded px-3 py-2 transition-colors',
                  !readonly && !disabled && 'hover:bg-muted/50',
                  disabled && 'opacity-50',
                  !selectedDate && 'text-muted-foreground italic',
                  displayClassName,
                  className,
                )}
              >
                <span>{displayValue}</span>
              </div>
            </PopoverTrigger>
            {!readonly && !disabled && (
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            )}
          </Popover>
        </>
      );
    }

    if (!isEditing) {
      return (
        <>
          {name && (
            <Input
              ref={hiddenInputRef}
              type="hidden"
              name={name}
              defaultValue={typeof value === 'string' ? value : ''}
            />
          )}
          <div
            onClick={handleClick}
            className={cn(
              readonly || disabled ? 'cursor-default' : 'cursor-pointer',
              'min-h-[2.5rem] rounded px-3 py-2 transition-colors',
              !readonly && !disabled && 'hover:bg-muted/50',
              disabled && 'opacity-50',
              variant !== 'textarea' && 'flex items-center',
              variant === 'textarea' && 'whitespace-pre-wrap',
              !value && 'text-muted-foreground italic',
              displayClassName,
              className,
            )}
          >
            {(value as string) || placeholder}
          </div>
        </>
      );
    }

    if (variant === 'input') {
      return (
        <Input
          ref={inputRef}
          type="text"
          value={tempValue as string}
          onChange={(e) => setTempValue(e.target.value as any)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn(
            'border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2',
            editClassName,
            className,
          )}
          placeholder={placeholder}
          readOnly={readonly}
          disabled={disabled}
        />
      );
    }

    if (variant === 'textarea') {
      return (
        <Textarea
          ref={textareaRef}
          value={tempValue as string}
          onChange={(e) => setTempValue(e.target.value as any)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          rows={rows}
          className={cn(
            'border-input bg-background ring-offset-background focus-visible:ring-ring font-inherit w-full resize-none whitespace-pre-wrap rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2',
            autoResize && 'overflow-hidden',
            editClassName,
            className,
          )}
          placeholder={placeholder}
          readOnly={readonly}
          disabled={disabled}
        />
      );
    }

    return (
      <div
        ref={contentEditableRef}
        contentEditable={!readonly && !disabled}
        onInput={handleContentEditableInput}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        className={cn(
          'border-input bg-background ring-offset-background focus-visible:ring-ring min-h-[2.5rem] w-full rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2',
          editClassName,
          className,
        )}
      >
        {tempValue as string}
      </div>
    );
  },
);

EditableText.displayName = 'EditableText';
