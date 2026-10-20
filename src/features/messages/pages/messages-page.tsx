'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, MessageSquare, Plus, Search, Send } from 'lucide-react'
import { codaMockData } from '@/src/lib/mock-data'
import { getPatients } from '@/src/lib/repositories/patients.repository'
import {
  createConversation,
  getConversations,
  getNotifications,
  replyToConversation,
  updateConversationStatus,
  updateNotificationRead,
} from '@/src/lib/repositories/messages.repository'
import type { Conversation, Notification, NotificationType, Patient } from '@/src/types/domain'

type InboxTab = 'messages' | 'alerts'
type ReadFilter = 'all' | 'unread' | 'read'

const demoStaffId = 'user_001'
const notificationTypes: NotificationType[] = ['MESSAGE', 'EMERGENCY_CHECK_IN', 'LAB_RESULT', 'APPOINTMENT', 'SYSTEM']

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function relativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1440)}d`
}

function notificationTypeLabel(type: NotificationType): string {
  return type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function keepDialogKeyboardFocus(event: React.KeyboardEvent<HTMLElement>, close: () => void): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'))
  const first = controls[0]
  const last = controls.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [activeTab, setActiveTab] = useState<InboxTab>('messages')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const dialogRef = useRef<HTMLElement | null>(null)

  const ownersById = useMemo(() => new Map(codaMockData.owners.map((owner) => [owner.id, owner])), [])
  const patientsById = useMemo(() => new Map(codaMockData.patients.map((patient) => [patient.id, patient])), [])
  const usersById = useMemo(() => new Map(codaMockData.users.map((user) => [user.id, user])), [])

  async function refresh() {
    setError('')
    try {
      const [nextConversations, nextNotifications, nextPatients] = await Promise.all([getConversations(), getNotifications(), getPatients()])
      setConversations([...nextConversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)))
      setNotifications([...nextNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      setPatients(nextPatients)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Messages could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])
  useEffect(() => {
    if (isComposing) dialogRef.current?.querySelector('select')?.focus()
  }, [isComposing])

  const selectedConversation = conversations.find(({ id }) => id === selectedConversationId)
  const selectedNotification = notifications.find(({ id }) => id === selectedNotificationId)
  const unreadConversations = conversations.filter(({ status }) => status === 'UNREAD').length
  const unreadNotifications = notifications.filter(({ read }) => !read).length
  const normalizedQuery = query.trim().toLowerCase()

  const visibleConversations = conversations.filter((conversation) => {
    if (readFilter === 'unread' && conversation.status !== 'UNREAD') return false
    if (readFilter === 'read' && conversation.status !== 'READ') return false
    const owner = ownersById.get(conversation.ownerId)
    const patient = patientsById.get(conversation.patientId)
    return !normalizedQuery || [conversation.subject, conversation.preview, owner?.displayName, patient?.name,
      ...conversation.messages.map(({ body }) => body)]
      .some((value) => value?.toLowerCase().includes(normalizedQuery))
  })

  const visibleNotifications = notifications.filter((notification) => {
    if (readFilter === 'unread' && notification.read) return false
    if (readFilter === 'read' && !notification.read) return false
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    const owner = notification.ownerId ? ownersById.get(notification.ownerId) : undefined
    const patient = notification.patientId ? patientsById.get(notification.patientId) : undefined
    return !normalizedQuery || [notification.title, notification.body, owner?.displayName, patient?.name]
      .some((value) => value?.toLowerCase().includes(normalizedQuery))
  })

  async function openConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id)
    setSelectedNotificationId(null)
    setSuccess('')
    if (conversation.status !== 'UNREAD') return
    try {
      const updated = await updateConversationStatus(conversation.id, 'READ')
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Conversation could not be marked as read.')
    }
  }

  async function toggleConversationRead() {
    if (!selectedConversation) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateConversationStatus(selectedConversation.id, selectedConversation.status === 'UNREAD' ? 'READ' : 'UNREAD')
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Conversation status could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function openNotification(notification: Notification) {
    setSelectedNotificationId(notification.id)
    setSelectedConversationId(null)
    setSuccess('')
    if (notification.read) return
    try {
      const updated = await updateNotificationRead(notification.id, true)
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Alert could not be marked as read.')
    }
  }

  async function toggleNotificationRead() {
    if (!selectedNotification) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateNotificationRead(selectedNotification.id, !selectedNotification.read)
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Alert status could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedConversation) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await replyToConversation(selectedConversation.id, reply, demoStaffId)
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)))
      setReply('')
      setSuccess('Reply saved locally in CODA. It was not sent to the owner.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reply could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function submitNewMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await createConversation({
        patientId: String(form.get('patientId') ?? ''),
        subject: String(form.get('subject') ?? ''),
        body: String(form.get('body') ?? ''),
        senderId: demoStaffId,
      })
      setConversations((current) => [created, ...current])
      setActiveTab('messages')
      setReadFilter('all')
      setSelectedConversationId(created.id)
      setSelectedNotificationId(null)
      setIsComposing(false)
      setSuccess('Message saved locally in CODA. It was not sent to the owner.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Message could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const selectedOwner = selectedConversation ? ownersById.get(selectedConversation.ownerId) : undefined
  const selectedPatient = selectedConversation ? patientsById.get(selectedConversation.patientId) : undefined
  const notificationOwner = selectedNotification?.ownerId ? ownersById.get(selectedNotification.ownerId) : undefined
  const notificationPatient = selectedNotification?.patientId ? patientsById.get(selectedNotification.patientId) : undefined

  return <div className="content inner-page">
    <div className="page-heading">
      <div><h1>Messages</h1><p>Keep pet owners informed and connected with the clinic.</p></div>
      <button className="new-appointment" type="button" onClick={() => { setIsComposing(true); setError(''); setSuccess('') }}><Plus size={18} /> New Message</button>
    </div>

    {error && <div role="alert" className="mb-5 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>}
    {success && <div role="status" className="mb-5 rounded-lg border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{success}</div>}

    <div className="mb-5 flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => { setActiveTab('messages'); setSelectedNotificationId(null) }} className={`rounded-lg border px-4 py-2 text-sm ${activeTab === 'messages' ? 'border-blue-500 bg-blue-950/50 text-blue-200' : 'border-slate-700 text-slate-300'}`}>
        <span className="inline-flex items-center gap-2"><MessageSquare size={16} /> Messages <span className="rounded-full bg-slate-800 px-2 py-0.5">{conversations.length} · {unreadConversations} unread</span></span>
      </button>
      <button type="button" onClick={() => { setActiveTab('alerts'); setSelectedConversationId(null) }} className={`rounded-lg border px-4 py-2 text-sm ${activeTab === 'alerts' ? 'border-blue-500 bg-blue-950/50 text-blue-200' : 'border-slate-700 text-slate-300'}`}>
        <span className="inline-flex items-center gap-2"><Bell size={16} /> Alerts <span className="rounded-full bg-slate-800 px-2 py-0.5">{notifications.length} · {unreadNotifications} unread</span></span>
      </button>
      <div className="ml-auto flex flex-wrap gap-2">
        {(['all', 'unread', 'read'] as const).map((filter) => <button key={filter} type="button" onClick={() => setReadFilter(filter)} className={`rounded-full border px-3 py-1.5 text-xs capitalize ${readFilter === filter ? 'border-blue-500 text-blue-200' : 'border-slate-700 text-slate-400'}`}>{filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}</button>)}
      </div>
    </div>

    <div className="messages-layout">
      <section className="panel conversation-list">
        <div className="conversation-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === 'messages' ? 'Search conversations' : 'Search alerts'} aria-label={activeTab === 'messages' ? 'Search conversations' : 'Search alerts'} /></div>
        {activeTab === 'alerts' && <div className="px-5 pb-3"><select aria-label="Filter alert type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as NotificationType | 'all')} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"><option value="all">All alert types</option>{notificationTypes.map((type) => <option key={type} value={type}>{notificationTypeLabel(type)}</option>)}</select></div>}
        {loading ? <p className="px-5 py-6 text-sm text-slate-400">Loading messages…</p> : activeTab === 'messages' ? visibleConversations.map((conversation) => {
          const owner = ownersById.get(conversation.ownerId)
          const patient = patientsById.get(conversation.patientId)
          const label = owner?.displayName ?? 'Owner unavailable'
          return <button className={`conversation ${selectedConversationId === conversation.id ? 'selected' : ''}`} key={conversation.id} onClick={() => void openConversation(conversation)} type="button">
            <div className="message-avatar">{initials(label)}</div><div><strong>{label}</strong><span>{patient?.name ? `${patient.name} · ` : ''}{conversation.preview}</span></div><small>{relativeTime(conversation.lastMessageAt)}{conversation.status === 'UNREAD' && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />}</small>
          </button>
        }) : visibleNotifications.map((notification) => {
          const patient = notification.patientId ? patientsById.get(notification.patientId) : undefined
          return <button className={`conversation ${selectedNotificationId === notification.id ? 'selected' : ''}`} key={notification.id} onClick={() => void openNotification(notification)} type="button">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${notification.priority === 'HIGH' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-blue-300'}`}><Bell size={17} /></div><div><strong>{notification.title}</strong><span>{patient?.name ? `${patient.name} · ` : ''}{notification.body}</span></div><small>{notification.priority === 'HIGH' ? 'High' : relativeTime(notification.createdAt)}{!notification.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />}</small>
          </button>
        })}
        {!loading && ((activeTab === 'messages' && visibleConversations.length === 0) || (activeTab === 'alerts' && visibleNotifications.length === 0)) && <p className="px-5 py-6 text-sm text-slate-400">{normalizedQuery ? 'No results match your search.' : 'Nothing to show here.'}</p>}
      </section>

      <section className="panel thread">
        {activeTab === 'messages' && selectedConversation ? <>
          <header><div className="message-avatar">{initials(selectedOwner?.displayName ?? '')}</div><div className="min-w-0"><strong>{selectedOwner?.displayName ?? 'Owner unavailable'}</strong><span className="!text-slate-400">{selectedPatient?.name ?? 'Patient unavailable'} · {selectedConversation.subject}</span></div><button type="button" onClick={() => void toggleConversationRead()} disabled={saving} className="ml-auto rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Mark {selectedConversation.status === 'UNREAD' ? 'read' : 'unread'}</button></header>
          <div className="thread-body">{selectedConversation.messages.map((message) => {
            const senderName = message.senderType === 'OWNER' ? (ownersById.get(message.senderId)?.displayName ?? 'Owner') : (usersById.get(message.senderId)?.displayName ?? 'Clinic team')
            return <div key={message.id} className={`bubble ${message.senderType === 'STAFF' ? 'sent' : 'received'}`}><div className="mb-1 text-xs opacity-70">{senderName} · {formatDate(message.sentAt)}</div>{message.body}</div>
          })}</div>
          <form className="composer" onSubmit={(event) => void sendReply(event)}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a message..." aria-label="Write a reply" /><button aria-label="Save reply" disabled={saving || !reply.trim()}><Send size={18} /></button></form>
          <p className="px-5 pb-4 text-center text-xs text-slate-500">Replies are saved locally in this prototype and are not sent externally.</p>
        </> : activeTab === 'alerts' && selectedNotification ? <>
          <header><div className={`grid h-10 w-10 place-items-center rounded-full ${selectedNotification.priority === 'HIGH' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-blue-300'}`}><Bell size={18} /></div><div className="min-w-0"><strong>{selectedNotification.title}</strong><span className="!text-slate-400">{notificationTypeLabel(selectedNotification.type)} · {formatDate(selectedNotification.createdAt)}</span></div><button type="button" onClick={() => void toggleNotificationRead()} disabled={saving} className="ml-auto rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Mark {selectedNotification.read ? 'unread' : 'read'}</button></header>
          <div className="thread-body"><div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5"><div className="mb-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{notificationTypeLabel(selectedNotification.type)}</span><span className={`rounded-full px-3 py-1 text-xs ${selectedNotification.priority === 'HIGH' ? 'bg-red-950 text-red-200' : 'bg-slate-800 text-slate-300'}`}>{selectedNotification.priority} priority</span><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{selectedNotification.read ? 'Read' : 'Unread'}</span></div><p className="whitespace-pre-wrap text-slate-200">{selectedNotification.body}</p>{(notificationOwner || notificationPatient) && <p className="mt-5 border-t border-slate-800 pt-4 text-sm text-slate-400">{notificationOwner?.displayName ?? 'Owner unavailable'}{notificationPatient ? ` · ${notificationPatient.name}` : ''}</p>}</div></div>
        </> : <div className="grid flex-1 place-items-center p-8 text-center text-slate-400"><div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-800 text-blue-300">{activeTab === 'messages' ? <MessageSquare /> : <Bell />}</div><p className="font-medium text-slate-200">{loading ? 'Loading…' : activeTab === 'messages' ? 'Select a conversation' : 'Select an alert'}</p><p className="mt-1 text-sm">{activeTab === 'messages' ? 'Choose a conversation to view its messages.' : 'Choose an alert to view its details.'}</p></div></div>}
      </section>
    </div>

    {isComposing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsComposing(false) }}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="new-message-title" onKeyDown={(event) => keepDialogKeyboardFocus(event, () => setIsComposing(false))} className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><h2 id="new-message-title" className="text-xl font-semibold text-white">New Message</h2><p className="mt-1 text-sm text-slate-400">Save a local conversation draft for a pet owner.</p></div><button type="button" onClick={() => setIsComposing(false)} disabled={saving} className="text-slate-400 hover:text-white" aria-label="Close">×</button></div>{error && <p role="alert" className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}<form onSubmit={(event) => void submitNewMessage(event)} className="space-y-4"><label className="block text-sm text-slate-300">Patient<select required name="patientId" defaultValue="" className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white"><option value="" disabled>Select a patient</option>{patients.filter((patient) => ownersById.has(patient.ownerId)).map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {ownersById.get(patient.ownerId)?.displayName}</option>)}</select></label><label className="block text-sm text-slate-300">Subject<input required name="subject" maxLength={120} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" /></label><label className="block text-sm text-slate-300">Message<textarea required name="body" rows={5} maxLength={2000} className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" /></label><p className="text-xs text-slate-500">This prototype stores the conversation in this browser. It does not send email, SMS, or external messages.</p><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsComposing(false)} disabled={saving} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Message'}</button></div></form></section></div>}
  </div>
}
