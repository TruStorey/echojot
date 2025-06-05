'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Brain, MessageSquare, Lock, CheckSquare } from 'lucide-react'
import matter from 'gray-matter'

type NoteBlock = {
  id: string
  type: 'reflect' | 'penny' | 'idea' | 'dark' | 'todo' | 'reminder'
  createdAt: string
  title?: string
  content?: string
  tags?: string[]
  doDate?: string
  reminderDate?: string
  linkedTodos?: string[]
  linkedReminders?: string[]
  linkedNotes?: string[]
  linkedBy?: string[]
}

type DayJournal = {
  date: string
  blocks: NoteBlock[] // all blocks (notes, todos, reminders) combined
}

const ICONS: Record<string, JSX.Element> = {
  reflect: <Brain size={20} className="text-blue-500" />,
  penny: <MessageSquare size={20} className="text-purple-500" />,
  idea: <MessageSquare size={20} className="text-green-500" />,
  dark: <Lock size={20} className="text-gray-500" />,
  todo: <CheckSquare size={20} className="text-yellow-600" />,
  reminder: <CalendarDays size={20} className="text-red-500" />,
}

const FOLDER_HANDLE_KEY = 'echoJotFolderHandle'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EchoJotHandles', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getStoredFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  const tx = db.transaction('handles', 'readonly')
  const store = tx.objectStore('handles')
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve) => {
    const req = store.get(FOLDER_HANDLE_KEY)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => resolve(null)
  })
  await tx.done
  return handle
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<DayJournal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadJournals() {
      setLoading(true)
      try {
        const rootHandle = await getStoredFolderHandle()
        if (!rootHandle) {
          setError('No journal folder selected. Please select a folder in Settings.')
          setJournals([])
          setLoading(false)
          return
        }

        const days: DayJournal[] = []

        for await (const entry of rootHandle.values()) {
          if (entry.kind === 'directory' && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)) {
            const dateStr = entry.name
            const dayFolder = entry as FileSystemDirectoryHandle

            const blocks: NoteBlock[] = []

            for await (const [fileName, fileHandle] of dayFolder.entries()) {
              if (fileHandle.kind !== 'file') continue
              if (!fileName.endsWith('.md')) continue

              try {
                const file = await fileHandle.getFile()
                const text = await file.text()
                const parsed = matter(text)
                const frontmatter = parsed.data as Partial<NoteBlock>
                const content = parsed.content

                if (!frontmatter.type || !frontmatter.createdAt) continue

                const id = frontmatter.id || fileName.replace(/\.md$/, '')

                blocks.push({
                  id,
                  type: frontmatter.type,
                  createdAt: frontmatter.createdAt,
                  title: frontmatter.title || '',
                  content,
                  tags: frontmatter.tags || [],
                  doDate: frontmatter.doDate,
                  reminderDate: frontmatter.reminderDate,
                  linkedTodos: frontmatter.linkedTodos || [],
                  linkedReminders: frontmatter.linkedReminders || [],
                  linkedNotes: frontmatter.linkedNotes || [],
                  linkedBy: frontmatter.linkedBy || [],
                })
              } catch (err) {
                console.error(`Error reading/parsing file ${fileName}:`, err)
              }
            }

            if (blocks.length) {
              blocks.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
              days.push({ date: dateStr, blocks })
            }
          }
        }

        days.sort((a, b) => (a.date < b.date ? 1 : -1))

        setJournals(days)
        setError(null)
      } catch (e: any) {
        setError('Failed to load journals: ' + e.message)
        setJournals([])
      } finally {
        setLoading(false)
      }
    }
    loadJournals()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-600">
        Loading journals...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      {error && <p className="text-red-600">{error}</p>}

      {journals.length === 0 && (
        <p className="text-gray-500 italic">No journal entries found.</p>
      )}

      {journals.map(({ date, blocks }) => {
        const remindersAndTodos = blocks.filter(b => b.type === 'reminder' || b.type === 'todo')
        const notes = blocks.filter(b => b.type !== 'reminder' && b.type !== 'todo')

        return (
          <section key={date}>
            <h2 className="text-2xl font-bold mb-6">{date}</h2>

            {remindersAndTodos.length > 0 && (
              <ul className="mb-8 space-y-6 relative pl-12 before:absolute before:left-8 before:top-0 before:bottom-0 before:w-[2px] before:bg-gray-300">
                {remindersAndTodos.map((block, i) => (
                  <li key={block.id} className="flex items-start gap-4 relative">
                    {/* Timeline line only between icons */}
                    {i !== remindersAndTodos.length - 1 && (
                      <span className="absolute left-5 top-7 h-[calc(100%+1.5rem)] w-[2px] bg-gray-300" />
                    )}
                    <div className="flex items-center gap-2 w-24 shrink-0 relative z-10">
                      {/* Time left of icon, but only for notes */}
                      {/* For reminders/todos, no time */}
                      <div className="text-sm text-gray-500 w-12 text-right">
                        {/* Empty for reminders/todos */}
                      </div>
                      <div className="rounded-full bg-white border border-gray-300 p-1">
                        {ICONS[block.type] || '📋'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-700">{block.title || block.id}</div>
                      <div className="whitespace-pre-wrap text-gray-600">{block.content}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {notes.length > 0 ? (
              <ul className="space-y-6 relative pl-12 before:absolute before:left-8 before:top-0 before:bottom-0 before:w-[2px] before:bg-gray-300">
                {notes.map((note, i) => (
                  <li key={note.id} className="flex items-start gap-4 relative">
                    {/* Timeline line only between icons */}
                    {i !== notes.length - 1 && (
                      <span className="absolute left-5 top-7 h-[calc(100%+1.5rem)] w-[2px] bg-gray-300" />
                    )}
                    <div className="flex items-center gap-2 w-24 shrink-0 relative z-10">
                      <div className="text-sm text-gray-500 w-12 text-right">
                        {formatTime(note.createdAt)}
                      </div>
                      <div className="rounded-full bg-white border border-gray-300 p-1">
                        {ICONS[note.type] || '📝'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-700">{note.title || note.id}</div>
                      <div className="whitespace-pre-wrap text-gray-600">{note.content}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No notes</p>
            )}
          </section>
        )
      })}
    </div>
  )
}