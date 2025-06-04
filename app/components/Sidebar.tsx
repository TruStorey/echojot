'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, CalendarDays, FileText, Settings } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  const navItems = [
    { href: '/', label: 'Home', icon: <Home size={20} /> },
    { href: '/journals', label: 'Journals', icon: <CalendarDays size={20} /> },
    { href: '/notes', label: 'Notes', icon: <FileText size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ]

  return (
    <aside className={`flex flex-col ${isOpen ? 'w-64' : 'w-16'} transition-width duration-300 bg-gray-900 border-r border-gray-700 text-gray-200`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className={`font-bold text-lg ${isOpen ? 'block' : 'hidden'}`}>Echo Jot</h1>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-gray-800"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 p-2 rounded hover:bg-gray-800 ${
                    active ? 'bg-blue-700 text-white font-semibold' : 'text-gray-300'
                  }`}
                >
                  {icon}
                  {isOpen && <span>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}