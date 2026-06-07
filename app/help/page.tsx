'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HelpPage() {
  const [flatName, setFlatName] = useState('My Shared Flat')
  const [roommates] = useState<string[]>(['Ayush', 'Aman', 'Piyush', 'Prem', 'Vishal'])

  useEffect(() => {
    // Load local storage fallback
    const storedFlat = localStorage.getItem('flatsplit_flatName')
    if (storedFlat) setFlatName(storedFlat)

    // Fetch up-to-date flat name from backend
    fetch('/api/ledger')
      .then((res) => {
        if (res.ok) return res.json()
      })
      .then((data) => {
        if (data && data.flat_name) {
          setFlatName(data.flat_name)
          localStorage.setItem('flatsplit_flatName', data.flat_name)
        }
      })
      .catch((err) => console.error("Error fetching ledger name:", err))
  }, [])

  return (
    <div className="portal-container" style={{ maxWidth: '650px', margin: '40px auto' }}>
      <div className="portal-header" style={{ marginBottom: '20px' }}>
        <div className="portal-title-row">
          <div>
            <h1>FlatSplit Help &amp; Configs 🏠⚡</h1>
            <p className="subtitle">Learn how to use the Retro Expense Ledger &amp; Settlement System</p>
          </div>
          <div>
            <Link href="/" style={{
              textDecoration: 'none',
              background: 'var(--accent)',
              color: 'var(--bg)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              ← Back to Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Configurations Display */}
      <fieldset style={{ marginBottom: '24px' }}>
        <legend>
          Configurations (Locked)
        </legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', padding: '4px 0' }}>
          <div>
            <strong>Flat Name:</strong> {flatName}
          </div>
          <div>
            <strong>Flatmates:</strong> {roommates.join(', ')}
          </div>
          <div style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
            🔒 Flat settings and roommate lists are locked and cannot be edited.
          </div>
        </div>
      </fieldset>

      {/* Help bulletin / instruction board */}
      <div className="bulletin-board" style={{ display: 'block', marginBottom: '24px' }}>
        <div className="bulletin-title">
          <span>📌 Quick Help Guide (Beginner-Friendly)</span>
        </div>
        <div className="bulletin-content">
          <ol style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Step 1:</strong> List of roommates is locked to the 5 active members: Ayush, Aman, Piyush, Prem, Vishal.</li>
            <li><strong>Step 2:</strong> Type your title, amount, select who paid, choose a split formulation, and click <i>Add Shared Expense</i>.</li>
            <li><strong>Step 3:</strong> Review balances. If someone owes money, click the <i>Auto-Fill</i> button in the <i>Smart Settle Guide</i> to automatically populate the settlement recorder!</li>
            <li><strong>✍️ Audit Trail:</strong> To maintain logs, all modifications ask you to identify which roommate is editing the record.</li>
            <li><strong>⚡ Session Cache:</strong> After identifying yourself once, your identity remains active for **5 minutes of inactivity** to prevent repetitive prompts!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
