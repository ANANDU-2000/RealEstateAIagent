'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Phone,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import {
  type ApiError,
  type Meeting,
  type Property,
  MEETING_TYPE_OPTIONS,
  createMeeting,
  listMeetings,
  listProperties,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';

const HOUR_START = 8;
const HOUR_END = 20;
const ROW_HEIGHT = 48;

const LEGEND = [
  { label: 'AI site visit', color: 'bg-success' },
  { label: 'Manual / office', color: 'bg-primary' },
  { label: 'Callback', color: 'bg-orange-500' },
  { label: 'Cancelled', color: 'bg-danger' },
  { label: 'No-show', color: 'bg-purple-600' },
];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return (err as ApiError).error;
  }
  return 'Something went wrong';
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function meetingTypeLabel(type: string): string {
  return MEETING_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function getMeetingColor(meeting: Meeting): string {
  if (meeting.status === 'cancelled') return 'bg-danger text-white';
  if (meeting.status === 'no_show') return 'bg-purple-600 text-white';
  if (meeting.meetingType === 'callback') return 'bg-orange-500 text-white';
  if (meeting.meetingType === 'office' || meeting.bookedBy === 'broker') {
    return 'bg-primary text-white';
  }
  return 'bg-success text-white';
}

function getMeetingBorderColor(meeting: Meeting): string {
  if (meeting.status === 'cancelled') return 'border-l-danger';
  if (meeting.status === 'no_show') return 'border-l-purple-600';
  if (meeting.meetingType === 'callback') return 'border-l-orange-500';
  if (meeting.meetingType === 'office' || meeting.bookedBy === 'broker') {
    return 'border-l-primary';
  }
  return 'border-l-success';
}

type BookForm = {
  customerName: string;
  customerPhone: string;
  propertyId: string;
  meetingType: Meeting['meetingType'];
  scheduledAt: string;
  notes: string;
};

const emptyBookForm = (): BookForm => ({
  customerName: '',
  customerPhone: '',
  propertyId: '',
  meetingType: 'site_visit',
  scheduledAt: '',
  notes: '',
});

export default function CalendarPage() {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState<BookForm>(emptyBookForm);
  const [bookError, setBookError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    []
  );

  const todayMeetings = useMemo(() => {
    const today = new Date();
    return meetings
      .filter((m) => isSameDay(new Date(m.scheduledAt), today))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [meetings]);

  const loadMeetings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 7).toISOString();
      const result = await listMeetings(accessToken, { from, to });
      setMeetings(result.meetings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, weekStart]);

  const loadProperties = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await listProperties(accessToken, { available: true });
      setProperties(result.properties);
    } catch {
      // non-blocking for calendar view
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    loadMeetings();
  }, [accessToken, authLoading, router, loadMeetings]);

  useEffect(() => {
    if (accessToken) loadProperties();
  }, [accessToken, loadProperties]);

  const handleMeetingBooked = useCallback(() => {
    loadMeetings();
  }, [loadMeetings]);

  useRealtime(accessToken, { onMeetingBooked: handleMeetingBooked });

  const goPrevWeek = () => setWeekStart((d) => addDays(d, -7));
  const goNextWeek = () => setWeekStart((d) => addDays(d, 7));
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const openBookModal = () => {
    setBookForm(emptyBookForm());
    setBookError(null);
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!bookForm.customerPhone.trim()) {
      setBookError('Customer phone is required');
      return;
    }
    if (!bookForm.scheduledAt) {
      setBookError('Scheduled time is required');
      return;
    }

    setBooking(true);
    setBookError(null);
    try {
      await createMeeting(accessToken, {
        customerName: bookForm.customerName.trim() || undefined,
        customerPhone: bookForm.customerPhone.trim(),
        propertyId: bookForm.propertyId || undefined,
        meetingType: bookForm.meetingType,
        scheduledAt: new Date(bookForm.scheduledAt).toISOString(),
        notes: bookForm.notes.trim() || undefined,
      });
      setShowBookModal(false);
      await loadMeetings();
    } catch (err) {
      setBookError(getErrorMessage(err));
    } finally {
      setBooking(false);
    }
  };

  const meetingsForDay = (day: Date) =>
    meetings.filter((m) => isSameDay(new Date(m.scheduledAt), day));

  const getEventStyle = (meeting: Meeting) => {
    const start = new Date(meeting.scheduledAt);
    const hour = start.getHours() + start.getMinutes() / 60;
    if (hour < HOUR_START || hour >= HOUR_END) return null;
    const top = (hour - HOUR_START) * ROW_HEIGHT;
    return { top: `${top}px`, height: `${ROW_HEIGHT - 4}px` };
  };

  if (authLoading || !accessToken) {
    return (
      <div className="mx-auto max-w-7xl">
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted">
            Site visits, office meetings, and callbacks in one view.
          </p>
        </div>
        <Button onClick={openBookModal}>
          <Plus className="h-4 w-4" />
          Book Visit
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={goPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={goNextWeek}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-2 text-sm font-semibold text-foreground">
          {formatMonthYear(weekStart)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      {error && (
        <Card padding="sm" className="mb-4 border-danger bg-danger-light">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="outline" size="sm" onClick={loadMeetings}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className="h-[576px] w-full rounded-xl" />
          ) : (
            <>
              {/* Desktop week grid */}
              <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border">
                    <div className="p-2" />
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-l border-border p-2 text-center text-xs font-semibold ${
                            isToday ? 'bg-primary-light text-primary' : 'text-foreground'
                          }`}
                        >
                          {formatDayLabel(day)}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative grid grid-cols-[50px_repeat(7,1fr)]">
                    <div>
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="border-b border-border pr-2 text-right text-[10px] text-muted"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {hour <= 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                      ))}
                    </div>

                    {weekDays.map((day) => (
                      <div key={day.toISOString()} className="relative border-l border-border">
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="border-b border-border bg-surface"
                            style={{ height: ROW_HEIGHT }}
                          />
                        ))}
                        {meetingsForDay(day).map((meeting) => {
                          const style = getEventStyle(meeting);
                          if (!style) return null;
                          return (
                            <div
                              key={meeting.id}
                              className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-[10px] leading-tight ${getMeetingColor(meeting)}`}
                              style={style}
                              title={`${meeting.customerName ?? meeting.customerPhone} — ${meetingTypeLabel(meeting.meetingType)}`}
                            >
                              <div className="truncate font-semibold">
                                {meeting.customerName ?? meeting.customerPhone}
                              </div>
                              <div className="truncate opacity-90">
                                {formatTime(new Date(meeting.scheduledAt))} ·{' '}
                                {meetingTypeLabel(meeting.meetingType)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile event cards */}
              <div className="space-y-3 lg:hidden">
                {weekDays.map((day) => {
                  const dayMeetings = meetingsForDay(day);
                  if (dayMeetings.length === 0) return null;
                  return (
                    <div key={day.toISOString()}>
                      <h3
                        className={`mb-2 text-sm font-semibold ${
                          isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {formatDayLabel(day)}
                      </h3>
                      <div className="space-y-2">
                        {dayMeetings.map((meeting) => (
                          <Card
                            key={meeting.id}
                            padding="sm"
                            className={`border-l-4 ${getMeetingBorderColor(meeting)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {meeting.customerName ?? 'Unknown'}
                                </p>
                                <p className="text-xs text-muted">{meeting.customerPhone}</p>
                              </div>
                              <span className="shrink-0 text-xs font-medium text-muted">
                                {formatTime(new Date(meeting.scheduledAt))}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {meetingTypeLabel(meeting.meetingType)}
                              {meeting.propertyName ? ` · ${meeting.propertyName}` : ''}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {meetings.length === 0 && (
                  <EmptyState
                    icon={CalendarDays}
                    title="No meetings this week"
                    description="Book a visit or wait for Arjun to schedule one from WhatsApp."
                    actionLabel="Book Visit"
                    onAction={openBookModal}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Today's schedule sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <Card padding="sm">
            <h2 className="mb-3 text-sm font-bold text-foreground">Today&apos;s Schedule</h2>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : todayMeetings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Nothing scheduled today.</p>
            ) : (
              <div className="space-y-2">
                {todayMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className={`rounded-lg border border-border border-l-4 bg-surface-2 p-3 ${getMeetingBorderColor(meeting)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted">
                        {formatTime(new Date(meeting.scheduledAt))} ·{' '}
                        {meetingTypeLabel(meeting.meetingType)}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-foreground">
                      {meeting.customerName ?? 'Unknown'}
                    </p>
                    {meeting.customerPhone && (
                      <a
                        href={`tel:${meeting.customerPhone}`}
                        className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {meeting.customerPhone}
                      </a>
                    )}
                    {meeting.propertyName && (
                      <p className="mt-1 text-xs text-muted">{meeting.propertyName}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* Book visit modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">Book Visit</h2>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBookSubmit} className="space-y-4 p-6">
              <Input
                label="Customer name"
                value={bookForm.customerName}
                onChange={(e) => setBookForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="Optional"
              />
              <Input
                label="Customer phone"
                value={bookForm.customerPhone}
                onChange={(e) => setBookForm((f) => ({ ...f, customerPhone: e.target.value }))}
                placeholder="+91 98765 43210"
                required
              />
              <Select
                label="Meeting type"
                value={bookForm.meetingType}
                onChange={(e) =>
                  setBookForm((f) => ({
                    ...f,
                    meetingType: e.target.value as Meeting['meetingType'],
                  }))
                }
                options={MEETING_TYPE_OPTIONS}
              />
              <Select
                label="Property (optional)"
                value={bookForm.propertyId}
                onChange={(e) => setBookForm((f) => ({ ...f, propertyId: e.target.value }))}
                options={[
                  { value: '', label: 'None' },
                  ...properties.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <Input
                label="Scheduled time"
                type="datetime-local"
                value={bookForm.scheduledAt}
                onChange={(e) => setBookForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                required
              />
              <Input
                label="Notes"
                value={bookForm.notes}
                onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
              {bookError && <p className="text-sm text-danger">{bookError}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" fullWidth onClick={() => setShowBookModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" fullWidth loading={booking}>
                  Book Visit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
