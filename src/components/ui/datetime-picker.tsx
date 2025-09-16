
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (!selectedDay) {
      setDate(undefined);
      return;
    }
    const newDate = new Date(selectedDay);
    if (date) {
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      newDate.setSeconds(date.getSeconds());
      newDate.setMilliseconds(date.getMilliseconds());
    }
    setDate(newDate);
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', value: string) => {
    const newDate = date ? new Date(date) : new Date();
    if (type === 'hour') {
      let hour = parseInt(value, 10);
      const isPM = newDate.getHours() >= 12;
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0; // Midnight case
      newDate.setHours(hour);
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === 'ampm') {
      const currentHour = newDate.getHours();
      if (value === 'PM' && currentHour < 12) {
        newDate.setHours(currentHour + 12);
      } else if (value === 'AM' && currentHour >= 12) {
        newDate.setHours(currentHour - 12);
      }
    }
    setDate(newDate);
  };
  
  const currentHour12 = date ? date.getHours() % 12 === 0 ? 12 : date.getHours() % 12 : 0;
  const currentMinute = date ? date.getMinutes() : 0;
  const currentAmPm = date ? (date.getHours() >= 12 ? 'PM' : 'AM') : 'AM';

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="grid grid-cols-3 gap-2">
        <Select onValueChange={(val) => handleTimeChange('hour', val)} value={currentHour12.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(val) => handleTimeChange('minute', val)} value={currentMinute.toString().padStart(2, '0')}>
          <SelectTrigger>
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(
              (minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select onValueChange={(val) => handleTimeChange('ampm', val)} value={currentAmPm}>
          <SelectTrigger>
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
