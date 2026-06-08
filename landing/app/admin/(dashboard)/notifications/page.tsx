'use client';

import { useState, useEffect } from 'react';

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  push_token: string | null;
  has_push_token: boolean;
  notification_prefs: {
    pre_training: boolean;
    post_session: boolean;
    motivational: boolean;
    weekly_review: boolean;
  } | null;
  notifications_paused_until: string | null;
  language: string;
}

interface NotificationType {
  type: string;
  label: string;
  default_path: string;
  defaults: {
    nl: { title: string; body: string };
    en: { title: string; body: string };
  };
}

interface AppScreen {
  path: string;
  label: string;
}

export default function NotificationsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [appScreens, setAppScreens] = useState<AppScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Notification form state
  const [selectedType, setSelectedType] = useState('custom');
  const [destinationScreen, setDestinationScreen] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lang, setLang] = useState<'nl' | 'en'>('nl');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/notifications')
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
          throw new Error(err.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        setUsers(data.users ?? []);
        setNotificationTypes(data.notificationTypes ?? []);
        setAppScreens(data.appScreens ?? []);

        // Pre-select first notification type with its defaults
        const firstType = (data.notificationTypes ?? [])[0];
        if (firstType) {
          setSelectedType(firstType.type);
          setDestinationScreen(firstType.default_path ?? '');
          const d = firstType.defaults?.nl;
          if (d) {
            setTitle(d.title);
            setBody(d.body);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message ?? 'Failed to load data');
        setLoading(false);
      });
  }, []);

  // When the type dropdown changes, update destination screen + pre-fill title/body
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const match = notificationTypes.find((nt) => nt.type === type);
    setDestinationScreen(match?.default_path ?? '');
    setCustomUrl('');
    setFormError(null);
    setSendResult(null);
    // Pre-fill title and body from defaults
    if (match?.defaults) {
      const d = match.defaults[lang] ?? match.defaults.nl;
      setTitle(d.title);
      setBody(d.body);
    } else {
      setTitle('');
      setBody('');
    }
  };

  // When language changes, update title/body if using a non-custom type
  const handleLangChange = (newLang: 'nl' | 'en') => {
    setLang(newLang);
    const match = notificationTypes.find((nt) => nt.type === selectedType);
    if (match?.defaults) {
      const d = match.defaults[newLang] ?? match.defaults.nl;
      setTitle(d.title);
      setBody(d.body);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const usersWithToken = filteredUsers.filter((u) => u.has_push_token);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    usersWithToken.length > 0 && usersWithToken.every((u) => selectedIds.has(u.id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        usersWithToken.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        usersWithToken.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const selectedTokens = users
    .filter((u) => selectedIds.has(u.id) && u.push_token)
    .map((u) => u.push_token!);

  const handleSend = async () => {
    setFormError(null);
    setSendResult(null);

    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!body.trim()) {
      setFormError('Body is required.');
      return;
    }
    if (selectedTokens.length === 0) {
      setFormError('Select at least one user with a push token.');
      return;
    }

    setSending(true);

    try {
      console.log('[Admin] Sending notification to', selectedTokens.length, 'tokens:', selectedTokens);

      const payload: Record<string, unknown> = {
        pushTokens: selectedTokens,
        title: title.trim(),
        body: body.trim(),
      };

      if (selectedType === 'custom') {
        if (customUrl.trim()) {
          payload.url = customUrl.trim();
        }
        // If a destination screen was picked in the dropdown, pass it as data.screen
        if (destinationScreen && !destinationScreen.startsWith('http')) {
          payload.data = { screen: destinationScreen };
        }
      } else {
        payload.type = selectedType;
        if (destinationScreen.startsWith('http')) {
          payload.url = destinationScreen;
        } else if (destinationScreen) {
          payload.data = { screen: destinationScreen };
        }
      }

      console.log('[Admin] Payload:', JSON.stringify(payload, null, 2));

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log('[Admin] Response:', res.status, JSON.stringify(result, null, 2));

      if (!res.ok || !result.success) {
        throw new Error(result.error || `Server error ${res.status}`);
      }

      // Show per-device delivery status from Expo
      const expoStatuses = (result.results ?? []).map((r: any) => {
        const d = r?.data;
        if (Array.isArray(d)) return d.map((x: any) => `${x.status}${x.message ? ': ' + x.message : ''}`).join(', ');
        return d ? `${d.status}${d.message ? ': ' + d.message : ''}` : 'unknown';
      }).join(' | ');

      setSendResult({ success: true, message: `Sent to ${result.sent} device(s). Expo: ${expoStatuses}` });
      setTitle('');
      setBody('');
      setCustomUrl('');
      setSelectedIds(new Set());
    } catch (err: any) {
      setSendResult({ success: false, message: err.message ?? 'An unexpected error occurred.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deco-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        <p className="font-semibold mb-1">Failed to load notifications data</p>
        <p>{loadError}</p>
      </div>
    );
  }

  const totalUsers = users.length;
  const withToken = users.filter((u) => u.has_push_token).length;
  const paused = users.filter(
    (u) => u.notifications_paused_until && new Date(u.notifications_paused_until) > new Date()
  ).length;

  const isCustomType = selectedType === 'custom';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <a
          href="/admin/notifications/templates"
          className="px-4 py-2 bg-deco-primary text-white rounded-lg text-sm font-semibold hover:bg-deco-primary-dark transition-colors"
        >
          Manage Templates
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="Total Users" value={totalUsers} />
        <StatBox label="With Push Token" value={withToken} accent />
        <StatBox label="Without Token" value={totalUsers - withToken} warn={totalUsers - withToken > 0} />
        <StatBox label="Paused" value={paused} />
      </div>

      {/* Send Notification Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Send Notification</h2>

        <div className="space-y-4">
          {/* Row 1: Type + Destination Screen + Language */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
              >
                {notificationTypes.map((nt) => (
                  <option key={nt.type} value={nt.type}>
                    {nt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Screen
              </label>
              <select
                value={destinationScreen}
                onChange={(e) => setDestinationScreen(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
              >
                <option value="">None (no navigation)</option>
                {appScreens.map((s) => (
                  <option key={s.path} value={s.path}>
                    {s.label}
                  </option>
                ))}
              </select>
              {destinationScreen && (
                <p className="text-xs text-gray-400 mt-1 font-mono">{destinationScreen}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as 'nl' | 'en')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
              >
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Row 2: Custom URL (only when Custom type selected) */}
          {isCustomType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External URL{' '}
                <span className="text-gray-400 font-normal">(optional — overrides destination screen)</span>
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Row 3: Title + Body */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Form error */}
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Send button + result */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-5 py-2.5 bg-deco-primary text-white rounded-lg text-sm font-semibold hover:bg-deco-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending
                ? 'Sending...'
                : `Send to ${selectedTokens.length} device${selectedTokens.length !== 1 ? 's' : ''}`}
            </button>

            {sendResult && (
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  sendResult.success ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    sendResult.success ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                {sendResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 mr-1">Users</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or role..."
            className="flex-1 min-w-[200px] max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deco-primary focus:border-transparent"
          />
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-sm text-deco-primary hover:bg-deco-primary/5 rounded-lg font-medium transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-gray-500 ml-auto">
            {selectedIds.size} selected &bull; {filteredUsers.length} shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    disabled={usersWithToken.length === 0}
                    className="rounded border-gray-300 text-deco-primary focus:ring-deco-primary disabled:opacity-30"
                  />
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Push Token</th>
                <th className="px-4 py-3">Notification Prefs</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPaused =
                    u.notifications_paused_until &&
                    new Date(u.notifications_paused_until) > new Date();
                  const isSelected = selectedIds.has(u.id);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => u.has_push_token && toggleSelect(u.id)}
                      className={`transition-colors ${
                        u.has_push_token ? 'cursor-pointer hover:bg-gray-50' : 'opacity-60'
                      } ${isSelected ? 'bg-deco-primary/5' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(u.id)}
                          disabled={!u.has_push_token}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-deco-primary focus:ring-deco-primary disabled:opacity-30"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {u.full_name || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {u.email || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === 'coach'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 uppercase text-xs">
                        {u.language || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {u.has_push_token ? (
                          <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {u.notification_prefs ? (
                          <div className="flex flex-wrap gap-1">
                            {u.notification_prefs.pre_training && <PrefBadge label="Pre" />}
                            {u.notification_prefs.post_session && <PrefBadge label="Post" />}
                            {u.notification_prefs.weekly_review && <PrefBadge label="Weekly" />}
                            {u.notification_prefs.motivational && <PrefBadge label="Motiv" />}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Default</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isPaused ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Paused
                          </span>
                        ) : u.has_push_token ? (
                          <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          accent ? 'text-deco-primary' : warn ? 'text-amber-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PrefBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
      {label}
    </span>
  );
}
