/* ============================================================
   Course Architect — Vite entry point
   ------------------------------------------------------------
   Your original builder files were written to use React from a
   global (CDN) script. This bridge exposes the same globals so
   they run unchanged on Vite. We'll refactor these into proper
   per-file imports incrementally — for now, "make it work".
   ============================================================ */
import React from 'react'
import { createRoot } from 'react-dom/client'
import './builder/builder.css'

// --- expose the globals the existing builder code expects ---
Object.assign(globalThis, {
  React,
  ReactDOM: { createRoot },
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
})

// --- load the builder modules in dependency order ---
// (dynamic imports run AFTER the globals above are set)
await import('./builder/data.jsx')
await import('./builder/course-module21.jsx')
await import('./builder/blocks.jsx')
await import('./builder/blocks-extra.jsx')
await import('./builder/lesson.jsx')
await import('./builder/sidebar.jsx')
await import('./builder/importer.jsx')
await import('./builder/library.jsx')
await import('./builder/dashboard.jsx')
await import('./builder/gate.jsx')

// seed the library once (before the app renders) so the dashboard isn't empty
if (!localStorage.getItem('lib_seeded')) {
  if (globalThis.loadLibrary().length === 0) globalThis.libraryUpsert(globalThis.loadCourse())
  localStorage.setItem('lib_seeded', '1')
}

await import('./builder/app.jsx') // this one renders the app
