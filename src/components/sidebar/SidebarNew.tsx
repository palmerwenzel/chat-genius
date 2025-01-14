'use client'

import Link from 'next/link'

interface Channel {
  id: string
  name: string
  visibility: 'public' | 'private'
}

export function Sidebar({ channels }: { channels: Channel[] }) {
  return (
    <nav className="h-full p-4 bg-gray-50">
      <h2 className="font-bold mb-2">Channels</h2>
      <ul className="space-y-1">
        {channels.map((ch) => (
          <li key={ch.id}>
            <Link
              href={`/chat/${ch.name}`}
              className="text-blue-600 hover:underline"
            >
              #{ch.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}