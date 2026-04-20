import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { toDateKey } from '../lib/studyLogic';
import './Widgets.css';
import './Phase8Widgets.css';

export const Resources: React.FC = () => {
  const { data, updateData } = useData();
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');

  const addResource = () => {
    if (!title.trim()) return;

    const palette = ['#5f8dff', '#35d6b5', '#ffba5f', '#ff6c78'];
    const next = {
      id: crypto.randomUUID(),
      title: title.trim(),
      tag: tag.trim() || 'General',
      color: palette[data.resources.length % palette.length],
    };

    updateData({ resources: [...data.resources, next] });
    setTitle('');
    setTag('');
  };

  const editResource = (resourceId: string) => {
    const resource = data.resources.find(item => item.id === resourceId);
    if (!resource) return;

    const nextTitle = window.prompt('Edit resource title', resource.title)?.trim();
    if (!nextTitle) return;
    const nextTag = window.prompt('Edit resource tag', resource.tag)?.trim();

    updateData({
      resources: data.resources.map(item => (
        item.id === resourceId ? { ...item, title: nextTitle, tag: nextTag || item.tag } : item
      )),
    });
  };

  const deleteResource = (resourceId: string) => {
    updateData({ resources: data.resources.filter(item => item.id !== resourceId) });
  };

  const moveResource = (resourceId: string, direction: -1 | 1) => {
    const currentIndex = data.resources.findIndex(item => item.id === resourceId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.resources.length) return;

    const nextResources = [...data.resources];
    [nextResources[currentIndex], nextResources[nextIndex]] = [nextResources[nextIndex], nextResources[currentIndex]];
    updateData({ resources: nextResources });
  };

  return (
    <div className="card widget-card resources-card">
      <div className="card-title">Quick resources</div>
      <div className="resources-list">
        {data.resources.map(res => (
          <div key={res.id} className="resource-item">
            <span className="resource-dot" style={{ backgroundColor: res.color }}></span>
            <span className="resource-title">{res.title}</span>
            <span className="resource-tag">{res.tag}</span>
            <div className="subject-actions">
              <button type="button" className="widget-btn mini" aria-label={`Move ${res.title} up`} onClick={() => moveResource(res.id, -1)}>↑</button>
              <button type="button" className="widget-btn mini" aria-label={`Move ${res.title} down`} onClick={() => moveResource(res.id, 1)}>↓</button>
              <button type="button" className="widget-btn mini" aria-label={`Edit ${res.title}`} onClick={() => editResource(res.id)}>edit</button>
              <button type="button" className="widget-btn mini danger" aria-label={`Delete ${res.title}`} onClick={() => deleteResource(res.id)}>del</button>
            </div>
          </div>
        ))}
        <div className="add-reminder-row">
          <input
            type="text"
            placeholder="resource title"
            className="add-reminder-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="tag"
            className="add-reminder-input"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
        </div>
        <button type="button" className="add-resource-btn" onClick={addResource}>+ add resource</button>
      </div>
    </div>
  );
};

export const Reminders: React.FC = () => {
  const { data, updateData } = useData();
  const [newReminder, setNewReminder] = useState('');

  const addReminder = () => {
    const description = newReminder.trim();
    if (!description) return;

    updateData({
      reminders: [
        {
          id: crypto.randomUUID(),
          title: 'Custom reminder',
          description,
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'info',
        },
        ...data.reminders,
      ],
    });
    setNewReminder('');
  };

  const editReminder = (reminderId: string) => {
    const reminder = data.reminders.find(item => item.id === reminderId);
    if (!reminder) return;

    const nextTitle = window.prompt('Edit reminder title', reminder.title)?.trim();
    if (!nextTitle) return;
    const nextDescription = window.prompt('Edit reminder description', reminder.description)?.trim();
    if (!nextDescription) return;

    updateData({
      reminders: data.reminders.map(item => (
        item.id === reminderId ? { ...item, title: nextTitle, description: nextDescription } : item
      )),
    });
  };

  const deleteReminder = (reminderId: string) => {
    updateData({ reminders: data.reminders.filter(item => item.id !== reminderId) });
  };

  const moveReminder = (reminderId: string, direction: -1 | 1) => {
    const currentIndex = data.reminders.findIndex(item => item.id === reminderId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.reminders.length) return;

    const nextReminders = [...data.reminders];
    [nextReminders[currentIndex], nextReminders[nextIndex]] = [nextReminders[nextIndex], nextReminders[currentIndex]];
    updateData({ reminders: nextReminders });
  };

  return (
    <div className="card widget-card reminders-card">
      <div className="card-title">Reminders</div>
      <div className="reminders-list">
        {data.reminders.map(rem => (
          <div key={rem.id} className={`reminder-item type-${rem.type}`}>
            <div className="reminder-header">
              <span className="reminder-title">{rem.title}</span>
              <span className="reminder-time">{rem.timeStr}</span>
            </div>
            <div className="reminder-desc">{rem.description}</div>
            <div className="reminder-actions">
              <button type="button" className="widget-btn mini" aria-label={`Move ${rem.title} up`} onClick={() => moveReminder(rem.id, -1)}>↑</button>
              <button type="button" className="widget-btn mini" aria-label={`Move ${rem.title} down`} onClick={() => moveReminder(rem.id, 1)}>↓</button>
              <button type="button" className="widget-btn mini" aria-label={`Edit ${rem.title}`} onClick={() => editReminder(rem.id)}>edit</button>
              <button type="button" className="widget-btn mini danger" aria-label={`Delete ${rem.title}`} onClick={() => deleteReminder(rem.id)}>del</button>
            </div>
          </div>
        ))}
      </div>
      <div className="add-reminder-row">
        <input
          type="text"
          placeholder="add a reminder..."
          className="add-reminder-input"
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
        />
        <button type="button" className="widget-btn add-btn" aria-label="Add reminder" onClick={addReminder}>+</button>
      </div>
    </div>
  );
};

export const CalendarWidget: React.FC = () => {
  const { data, logStudySession, fetchUpcomingCalendarEvents, planTomorrowStudySchedule } = useData();
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(today));
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{ id: string; summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; description?: string }>>([]);
  const [calendarStatus, setCalendarStatus] = useState('Google Calendar is ready to sync study events.');
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isPlanningTomorrow, setIsPlanningTomorrow] = useState(false);

  const monthLabel = baseMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1).getDay();
  const prevMonthLastDay = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 0).getDate();

  const prevMonthDays = Array.from({ length: firstWeekday }, (_, idx) => prevMonthLastDay - firstWeekday + idx + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDays = Array.from({ length: (7 - (totalCells % 7 || 7)) % 7 }, (_, i) => i + 1);

  const selectedStudyHours = data.activityData[selectedDate] ?? 0;
  const selectedBreakHours = selectedStudyHours * 0.2;
  const focusRatio = selectedStudyHours > 0
    ? Math.round((selectedStudyHours / (selectedStudyHours + selectedBreakHours)) * 100)
    : 0;

  const hoursToClass = (hours: number) => {
    if (hours >= 6) return 'cal-intense';
    if (hours >= 4) return 'cal-active';
    if (hours >= 2) return 'cal-active';
    if (hours > 0) return 'cal-active';
    return '';
  };

  const dateKeyFor = (day: number) => toDateKey(new Date(baseMonth.getFullYear(), baseMonth.getMonth(), day));

  const refreshUpcomingEvents = async () => {
    setIsCalendarLoading(true);
    const result = await fetchUpcomingCalendarEvents();
    setUpcomingEvents(result.events);
    setCalendarStatus(result.message);
    setIsCalendarLoading(false);
  };

  useEffect(() => {
    void refreshUpcomingEvents();
  }, [data.user?.name]);

  const setSelectedHours = async (hours: number) => {
    await logStudySession({
      source: 'heatmap',
      dateKey: selectedDate,
      hours: Number(hours.toFixed(1)),
    });
    void refreshUpcomingEvents();
  };

  const planTomorrow = async () => {
    setIsPlanningTomorrow(true);
    const result = await planTomorrowStudySchedule();
    setCalendarStatus(result.message);
    await refreshUpcomingEvents();
    setIsPlanningTomorrow(false);
  };

  const formatEventTime = (value?: string) => {
    if (!value) {
      return 'All day';
    }

    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card widget-card calendar-card">
      <div className="calendar-topline">Monthly Overview</div>

      <div className="calendar-header">
        <button type="button" className="cal-nav" aria-label="Previous month" onClick={() => setMonthOffset((prev) => prev - 1)}>&lt;</button>
        <div className="cal-month">{monthLabel}</div>
        <button type="button" className="cal-nav" aria-label="Next month" onClick={() => setMonthOffset((prev) => prev + 1)}>&gt;</button>
      </div>

      <div className="calendar-grid">
        {days.map(d => <div key={d} className="cal-day-name">{d}</div>)}

        {prevMonthDays.map(d => (
          <div key={`prev-${d}`} className="cal-date cal-muted">{d}</div>
        ))}

        {currentMonthDays.map(d => {
          const dateKey = dateKeyFor(d);
          const hours = data.activityData[dateKey] ?? 0;
          let extraClass = `cal-date ${hoursToClass(hours)}`;
          if (selectedDate === dateKey) extraClass += ' cal-selected';

          return (
            <div key={`day-${d}`} className={extraClass} onClick={() => setSelectedDate(dateKey)}>
              {d}
            </div>
          );
        })}

        {nextMonthDays.map(d => (
          <div key={`next-${d}`} className="cal-date cal-muted">{d}</div>
        ))}
      </div>

      <div className="calendar-legend">
        <span><i className="lg-0"></i> 0-2h</span>
        <span><i className="lg-1"></i> 2-4h</span>
        <span><i className="lg-2"></i> 4-6h</span>
        <span><i className="lg-3"></i> 6+h</span>
      </div>

      <div className="selected-day-card">
        <div className="selected-day-header">
          <div>
            <small>Selected day</small>
            <p>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>
          <span>{selectedStudyHours > 0 ? 'Active' : 'Idle'}</span>
        </div>

        <div className="selected-metrics">
          <div>
            <small>Study</small>
            <strong>{selectedStudyHours.toFixed(1)}h</strong>
          </div>
          <div>
            <small>Break</small>
            <strong>{selectedBreakHours.toFixed(1)}h</strong>
          </div>
          <div>
            <small>Focus ratio</small>
            <strong>{focusRatio}%</strong>
          </div>
        </div>

        <div className="selected-hours-grid" style={{ marginTop: '10px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(hours => (
            <button key={hours} type="button" className="widget-btn selected-hours-btn" aria-label={`Log ${hours} hours for ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}`} onClick={() => setSelectedHours(hours)}>{hours}h</button>
          ))}
        </div>

        <button type="button" className="widget-btn calendar-plan-btn" onClick={planTomorrow} disabled={isPlanningTomorrow} aria-label="Plan tomorrow's study sessions">
          {isPlanningTomorrow ? 'Planning...' : 'Plan Tomorrow'}
        </button>

        <div className="calendar-sync-status" aria-live="polite">
          {calendarStatus}
        </div>

        <div className="upcoming-study-list">
          <div className="upcoming-study-heading">
            <span>Upcoming Tracklio sessions</span>
            <small>{isCalendarLoading ? 'Loading…' : `${upcomingEvents.length} events`}</small>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="upcoming-study-empty">No upcoming Tracklio events synced yet.</p>
          ) : upcomingEvents.slice(0, 4).map((event) => (
            <article key={event.id} className="upcoming-study-item">
              <strong>{event.summary}</strong>
              <span>{formatEventTime(event.start.dateTime)} - {formatEventTime(event.end.dateTime)}</span>
              {event.description && <p>{event.description}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
