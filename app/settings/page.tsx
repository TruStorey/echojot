'use client'

import { useState, useEffect } from 'react'

const FOLDER_HANDLE_KEY = 'echoJotFolderHandle'

async function verifyPermission(handle: FileSystemHandle, readWrite = false) {
  const options = {}
  if (readWrite) options.mode = 'readwrite'
  if ((await handle.queryPermission(options)) === 'granted') {
    return true
  }
  if ((await handle.requestPermission(options)) === 'granted') {
    return true
  }
  return false
}

// Helper to get full path from handle (best effort)
async function getFullPath(handle: FileSystemDirectoryHandle): Promise<string> {
  let path = handle.name
  let currentHandle: any = handle
  while (currentHandle && currentHandle.getParent) {
    try {
      currentHandle = await currentHandle.getParent()
      if (currentHandle) path = currentHandle.name + '/' + path
    } catch {
      break
    }
  }
  return path
}

export default function SettingsPage() {
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    dateFolders: 0,
    reminders: 0,
    notes: 0,
    tasks: 0,
  })

  // Restore folder handle from IndexedDB on mount
  useEffect(() => {
    async function restoreFolder() {
      try {
        const stored = await window.indexedDB?.databases ? await getStoredFolderHandle() : null
        if (stored) {
          const hasPermission = await verifyPermission(stored, true)
          if (hasPermission) {
            setFolderHandle(stored)
            setError(null)
          } else {
            setError('Please re-select your folder to grant permissions.')
          }
        }
      } catch {
        // ignore
      }
    }
    restoreFolder()
  }, [])

  // Update folder path when folderHandle changes
  useEffect(() => {
    if (!folderHandle) {
      setFolderPath(null)
      return
    }
    setFolderPath(folderHandle.name)
  }, [folderHandle])

  // Save folder handle to IndexedDB
  async function saveFolderHandle(handle: FileSystemDirectoryHandle) {
    const db = await openDB()
    const tx = db.transaction('handles', 'readwrite')
    const store = tx.objectStore('handles')
    await store.put(handle, FOLDER_HANDLE_KEY)
    await tx.done
  }

  // Open IndexedDB and create object store if needed
  function openDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
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

  // Get stored folder handle from IndexedDB
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

  // Scan folder for stats when folderHandle changes
  useEffect(() => {
    async function scanFolder() {
      if (!folderHandle) {
        setStats({ dateFolders: 0, reminders: 0, notes: 0, tasks: 0 })
        return
      }
      try {
        let dateFolders = 0
        let reminders = 0
        let notes = 0
        let tasks = 0

        for await (const entry of folderHandle.values()) {
          if (entry.kind === 'directory' && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)) {
            dateFolders++
            for await (const fileEntry of (entry as FileSystemDirectoryHandle).values()) {
              if (fileEntry.kind === 'file') {
                const name = fileEntry.name.toLowerCase()
                if (name.startsWith('reminder-') && name.endsWith('.md')) reminders++
                else if (name.match(/^\d{3}-.+\.md$/)) notes++
                else if (name.match(/^task-.+\.md$/)) tasks++
              }
            }
          }
        }

        setStats({ dateFolders, reminders, notes, tasks })
        setError(null)
      } catch (e: any) {
        setError('Failed to scan folder: ' + e.message)
      }
    }
    scanFolder()
  }, [folderHandle])

  async function pickFolder() {
    setError(null)
    try {
      // @ts-ignore
      const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker()
      const hasPermission = await verifyPermission(handle, true)
      if (!hasPermission) {
        setError('Permission denied for selected folder.')
        return
      }
      setFolderHandle(handle)
      await saveFolderHandle(handle)
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError('Failed to pick folder: ' + e.message)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Storage Folder</h2>
        <p className="mb-4 text-gray-700">
          Choose a local folder where your journal notes will be saved.
        </p>
        <button
          onClick={pickFolder}
          className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
        >
          {folderHandle ? 'Change Folder' : 'Select Folder'}
        </button>
      </section>

      {folderHandle && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Folder Summary</h2>
          <div className="mt-4 text-violet-400">
            <p>
              Selected folder: {folderPath}
            </p>
            <div className="mt-2 list-disc list-inside text-gray-400 bg-gray-900 p-4 rounded-lg max-w-sm">
              <div>📅 Total Date folders: {stats.dateFolders}</div>
              <div>🧠 Total Reminders: {stats.reminders}</div>
              <div>📝 Total Note blocks: {stats.notes}</div>
              <div>📋 Total Tasks: {stats.tasks}</div>
            </div>
          </div>
        </section>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  )
}