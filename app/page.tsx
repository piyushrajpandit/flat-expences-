'use client'

import { useState, useEffect } from 'react'

interface Expense {
  id: string
  title: string
  amount: number
  paidBy: string
  splitType: 'equal' | 'percentage' | 'custom'
  shares: Record<string, number>
  date: string
  category: string
  createdBy?: string
}

interface Settlement {
  id: string
  from: string
  to: string
  amount: number
  date: string
  note: string
  createdBy?: string
}

export default function RetroApp() {
  const [mounted, setMounted] = useState(false)
  const [showHelp, setShowHelp] = useState(true)
  const [flatName, setFlatName] = useState('My Shared Flat')
  
  // Lock roommates statically to Ayush, Aman, Piyush, Prem, Vishal
  const [roommates, setRoommates] = useState<string[]>(['Ayush', 'Aman', 'Piyush', 'Prem', 'Vishal'])

  // Session caching state
  const [sessionAuthor, setSessionAuthor] = useState<string | null>(null)
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0)

  // Audit trail state (displays who made the last change at the bottom)
  const [lastChangeBy, setLastChangeBy] = useState<string>('System')
  const [lastChangeAction, setLastChangeAction] = useState<string>('Ledger Initialized')

  // Form states
  const [expTitle, setExpTitle] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expPaidBy, setExpPaidBy] = useState('')
  const [expSplitType, setExpSplitType] = useState<'equal' | 'percentage' | 'custom'>('equal')
  const [expCustomShares, setExpCustomShares] = useState<Record<string, string>>({})
  const [expCategory, setExpCategory] = useState('Food')
  const [expDate, setExpDate] = useState('')

  // Settle form states
  const [settleFrom, setSettleFrom] = useState('')
  const [settleTo, setSettleTo] = useState('')
  const [settleAmount, setSettleAmount] = useState('')
  const [settleNote, setSettleNote] = useState('')

  // Application database state
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [statusMessage, setStatusMessage] = useState('System ready.')

  // PWA install trigger states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  // Load from local storage on mount & check session storage
  useEffect(() => {
    setMounted(true)
    const storedFlat = localStorage.getItem('flatsplit_flatName')
    const storedExpenses = localStorage.getItem('flatsplit_expenses')
    const storedSettlements = localStorage.getItem('flatsplit_settlements')
    const storedLastBy = localStorage.getItem('flatsplit_lastChangeBy')
    const storedLastAction = localStorage.getItem('flatsplit_lastChangeAction')

    if (storedFlat) setFlatName(storedFlat)
    if (storedExpenses) {
      try {
        setExpenses(JSON.parse(storedExpenses))
      } catch (e) {}
    }
    if (storedSettlements) {
      try {
        setSettlements(JSON.parse(storedSettlements))
      } catch (e) {}
    }
    if (storedLastBy) setLastChangeBy(storedLastBy)
    if (storedLastAction) setLastChangeAction(storedLastAction)

    // Force fixed roommates list
    const fixedRoommates = ['Ayush', 'Aman', 'Piyush', 'Prem', 'Vishal']
    setRoommates(fixedRoommates)

    // Default expPaidBy to first roommate (Ayush)
    setExpPaidBy(fixedRoommates[0])
    setSettleFrom(fixedRoommates[0])
    setSettleTo(fixedRoommates[1]) // Aman

    // Default date to today
    const today = new Date().toISOString().split('T')[0]
    setExpDate(today)

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Check if running on iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    // On iOS Safari, beforeinstallprompt is not supported, but we can show instructions
    // if we detect iOS and it is not already running in standalone mode (installed).
    if (ios && !(window.navigator as any).standalone) {
      setShowInstallBtn(true)
    }

    // Check if already running in standalone (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false)
    }

    // Polling session storage for 5-minute auth cache
    const checkSession = () => {
      const cachedTimeStr = sessionStorage.getItem('flatsplit_session_auth_time')
      const cachedAuthor = sessionStorage.getItem('flatsplit_session_author')
      if (cachedTimeStr && cachedAuthor) {
        const cachedTime = parseInt(cachedTimeStr, 10)
        const elapsed = Date.now() - cachedTime
        const remaining = 5 * 60 * 1000 - elapsed
        if (remaining > 0) {
          setSessionAuthor(cachedAuthor)
          setSessionTimeLeft(Math.ceil(remaining / 1000))
        } else {
          // session expired
          sessionStorage.removeItem('flatsplit_session_auth_time')
          sessionStorage.removeItem('flatsplit_session_author')
          setSessionAuthor(null)
          setSessionTimeLeft(0)
        }
      } else {
        setSessionAuthor(null)
        setSessionTimeLeft(0)
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 5000) // check every 5 seconds
    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  // Custom click handler for PWA install
  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSHint(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted PWA installation')
      setShowInstallBtn(false)
    }
    setDeferredPrompt(null)
  }

  // Save helper functions
  const saveToStorage = (
    updatedFlat: string,
    updatedRoommates: string[],
    updatedExpenses: Expense[],
    updatedSettlements: Settlement[],
    changeBy?: string,
    changeAction?: string
  ) => {
    localStorage.setItem('flatsplit_flatName', updatedFlat)
    localStorage.setItem('flatsplit_roommates', JSON.stringify(updatedRoommates))
    localStorage.setItem('flatsplit_expenses', JSON.stringify(updatedExpenses))
    localStorage.setItem('flatsplit_settlements', JSON.stringify(updatedSettlements))

    if (changeBy && changeAction) {
      localStorage.setItem('flatsplit_lastChangeBy', changeBy)
      localStorage.setItem('flatsplit_lastChangeAction', changeAction)
      setLastChangeBy(changeBy)
      setLastChangeAction(changeAction)
    }

    setStatusMessage('Ledger saved to local storage.')
  }

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('flatsplit_session_auth_time')
    sessionStorage.removeItem('flatsplit_session_author')
    setSessionAuthor(null)
    setSessionTimeLeft(0)
    setStatusMessage('Admin session terminated.')
  }

  // Helper to verify admin password and retrieve the author's identity (with 5-minute session cache)
  const verifyActionAndGetAuthor = (actionDescription: string): string | null => {
    const cachedTimeStr = sessionStorage.getItem('flatsplit_session_auth_time')
    const cachedAuthor = sessionStorage.getItem('flatsplit_session_author')
    const now = Date.now()

    if (cachedTimeStr && cachedAuthor) {
      const cachedTime = parseInt(cachedTimeStr, 10)
      if (now - cachedTime < 5 * 60 * 1000) {
        // Extend session active time on successful action
        sessionStorage.setItem('flatsplit_session_auth_time', now.toString())
        setSessionTimeLeft(300) // update state immediately to 5 minutes
        return cachedAuthor
      }
    }

    // Otherwise, prompt for authorization
    const pw = prompt(`Action Authorization required:\n"${actionDescription}"\n\nEnter admin password:`)
    if (pw !== 'baroi') {
      alert('Error: Incorrect password!')
      setStatusMessage(`Error: "${actionDescription}" rejected (incorrect password).`)
      return null
    }

    const roommatesStr = roommates.join(', ')
    const author = prompt(
      `Password accepted!\n\nWho is making this change?\n(Active flatmates: ${roommatesStr})`
    )

    if (author === null) {
      setStatusMessage(`Action: "${actionDescription}" canceled by user.`)
      return null
    }

    const trimmedAuthor = author.trim()
    const finalAuthor = trimmedAuthor.length > 0 ? trimmedAuthor : 'Admin'

    // Store in session storage
    sessionStorage.setItem('flatsplit_session_auth_time', Date.now().toString())
    sessionStorage.setItem('flatsplit_session_author', finalAuthor)

    // Update component states
    setSessionAuthor(finalAuthor)
    setSessionTimeLeft(300)

    // Update status message
    setStatusMessage(`Session authenticated as ${finalAuthor} for 5 minutes.`)
    return finalAuthor
  }

  // Reset all data
  const handleClearAll = () => {
    if (!confirm('Are you sure you want to clear ALL data? This cannot be undone.')) return

    const author = verifyActionAndGetAuthor('Clear All Ledger Records')
    if (!author) return

    setExpenses([])
    setSettlements([])
    saveToStorage(flatName, roommates, [], [], author, 'Cleared all database records')
    setStatusMessage(`All records cleared by ${author}.`)
  }

  // Handle Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(expAmount)
    if (!expTitle || isNaN(amountNum) || amountNum <= 0) {
      alert('Please fill out Title and enter a valid positive Amount.')
      return
    }

    if (!expPaidBy) {
      alert('Please select who paid.')
      return
    }

    let calculatedShares: Record<string, number> = {}

    if (expSplitType === 'equal') {
      const share = amountNum / roommates.length
      roommates.forEach((r) => {
        calculatedShares[r] = Math.round(share * 100) / 100
      })
    } else if (expSplitType === 'percentage') {
      let totalPct = 0
      roommates.forEach((r) => {
        const pct = parseFloat(expCustomShares[r] || '0')
        totalPct += pct
        calculatedShares[r] = Math.round(((pct / 100) * amountNum) * 100) / 100
      })
      if (Math.abs(totalPct - 100) > 0.1) {
        alert(`Error: Percentages must sum to 100%. Current sum: ${totalPct}%`)
        return
      }
    } else {
      // custom amount split
      let totalAmt = 0
      roommates.forEach((r) => {
        const amt = parseFloat(expCustomShares[r] || '0')
        totalAmt += amt
        calculatedShares[r] = amt
      })
      if (Math.abs(totalAmt - amountNum) > 0.05) {
        alert(`Error: Custom shares must sum to total amount (${amountNum}). Current sum: ${totalAmt}`)
        return
      }
    }

    const author = verifyActionAndGetAuthor(`Add Expense "${expTitle}" of ₹${amountNum.toFixed(2)}`)
    if (!author) return

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: expTitle,
      amount: amountNum,
      paidBy: expPaidBy,
      splitType: expSplitType,
      shares: calculatedShares,
      date: expDate || new Date().toISOString().split('T')[0],
      category: expCategory,
      createdBy: author,
    }

    const updatedExpenses = [newExpense, ...expenses]
    setExpenses(updatedExpenses)
    saveToStorage(
      flatName,
      roommates,
      updatedExpenses,
      settlements,
      author,
      `Added expense "${expTitle}" (₹${amountNum.toFixed(2)})`
    )

    // Reset Form
    setExpTitle('')
    setExpAmount('')
    setStatusMessage(`Added expense: "${newExpense.title}" for ₹${newExpense.amount} (recorded by ${author})`)
  }

  // Handle Delete Expense
  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find((e) => e.id === id)
    if (!expenseToDelete) return
    if (!confirm(`Are you sure you want to delete expense: "${expenseToDelete.title}"?`)) return

    const author = verifyActionAndGetAuthor(`Delete Expense: "${expenseToDelete.title}"`)
    if (!author) return

    const updatedExpenses = expenses.filter((e) => e.id !== id)
    setExpenses(updatedExpenses)
    saveToStorage(
      flatName,
      roommates,
      updatedExpenses,
      settlements,
      author,
      `Deleted expense "${expenseToDelete.title}"`
    )
    setStatusMessage(`Expense "${expenseToDelete.title}" deleted by ${author}.`)
  }

  // Handle Add Settlement
  const handleAddSettlement = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const amountNum = parseFloat(settleAmount)
    if (!settleFrom || !settleTo || isNaN(amountNum) || amountNum <= 0) {
      alert('Please select valid From/To roommates and a positive Amount.')
      return
    }

    if (settleFrom === settleTo) {
      alert('Error: From roommate cannot be the same as To roommate.')
      return
    }

    const author = verifyActionAndGetAuthor(`Record Payment: ${settleFrom} paid ${settleTo} ₹${amountNum.toFixed(2)}`)
    if (!author) return

    const newSettlement: Settlement = {
      id: Date.now().toString(),
      from: settleFrom,
      to: settleTo,
      amount: amountNum,
      date: new Date().toISOString().split('T')[0],
      note: settleNote || 'Settlement payment',
      createdBy: author,
    }

    const updatedSettlements = [newSettlement, ...settlements]
    setSettlements(updatedSettlements)
    saveToStorage(
      flatName,
      roommates,
      expenses,
      updatedSettlements,
      author,
      `Recorded payment: ${settleFrom} paid ${settleTo} ₹${amountNum.toFixed(2)}`
    )

    // Reset Form
    setSettleAmount('')
    setSettleNote('')
    setStatusMessage(`Recorded payment: ${newSettlement.from} paid ${newSettlement.to} ₹${newSettlement.amount} (recorded by ${author})`)
  }

  // Handle Delete Settlement
  const handleDeleteSettlement = (id: string) => {
    const settlementToDelete = settlements.find((s) => s.id === id)
    if (!settlementToDelete) return
    if (!confirm(`Are you sure you want to delete settlement: ${settlementToDelete.from} to ${settlementToDelete.to} (₹${settlementToDelete.amount})?`)) return

    const author = verifyActionAndGetAuthor(`Delete Settlement: ₹${settlementToDelete.amount}`)
    if (!author) return

    const updatedSettlements = settlements.filter((s) => s.id !== id)
    setSettlements(updatedSettlements)
    saveToStorage(
      flatName,
      roommates,
      expenses,
      updatedSettlements,
      author,
      `Deleted settlement of ₹${settlementToDelete.amount}`
    )
    setStatusMessage(`Settlement of ₹${settlementToDelete.amount} deleted by ${author}.`)
  }

  // Quick Settle helper (auto-fills Settle Up form)
  const handleQuickSettle = (from: string, to: string, amount: number) => {
    setSettleFrom(from)
    setSettleTo(to)
    setSettleAmount(amount.toString())
    setSettleNote(`Settle debt of ₹${amount}`)
    // Scroll to settle form
    const formElement = document.getElementById('settle-section')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Compute Net Balances
  const netBalances: Record<string, number> = {}
  roommates.forEach((r) => {
    netBalances[r] = 0
  })

  expenses.forEach((exp) => {
    // Creditor gets money back
    if (netBalances[exp.paidBy] !== undefined) {
      netBalances[exp.paidBy] += exp.amount
    }
    // Debtors pay their shares
    Object.entries(exp.shares).forEach(([person, share]) => {
      if (netBalances[person] !== undefined) {
        netBalances[person] -= share
      }
    })
  })

  settlements.forEach((settle) => {
    if (netBalances[settle.from] !== undefined) {
      netBalances[settle.from] += settle.amount
    }
    if (netBalances[settle.to] !== undefined) {
      netBalances[settle.to] -= settle.amount
    }
  })

  // Compute direct peer-to-peer debts (P2P netting)
  // Ensures that adjustments stay strictly between the pairs, without affecting uninvolved roommates.
  const calculateDirectDebts = () => {
    const transactions: { from: string; to: string; amount: number }[] = []

    // Loop through all unique pairs of roommates i < j
    for (let i = 0; i < roommates.length; i++) {
      for (let j = i + 1; j < roommates.length; j++) {
        const personA = roommates[i]
        const personB = roommates[j]

        // Calculate direct net balance between A and B
        let aOwesB = 0

        // 1. Accumulate B's share in expenses paid by A (A is creditor, so B owes A, meaning negative to aOwesB)
        // Accumulate A's share in expenses paid by B (B is creditor, so A owes B, meaning positive to aOwesB)
        expenses.forEach((exp) => {
          if (exp.paidBy === personB && exp.shares[personA] !== undefined) {
            aOwesB += exp.shares[personA]
          }
          if (exp.paidBy === personA && exp.shares[personB] !== undefined) {
            aOwesB -= exp.shares[personB]
          }
        })

        // 2. Accumulate settlements from A to B (A paying B reduces A's debt to B)
        // Accumulate settlements from B to A (B paying A reduces B's debt to A, i.e. increases A's relative debt)
        settlements.forEach((settle) => {
          if (settle.from === personA && settle.to === personB) {
            aOwesB -= settle.amount
          }
          if (settle.from === personB && settle.to === personA) {
            aOwesB += settle.amount
          }
        })

        // If net result is positive, A owes B. If negative, B owes A.
        if (aOwesB > 0.01) {
          transactions.push({
            from: personA,
            to: personB,
            amount: Math.round(aOwesB * 100) / 100
          })
        } else if (aOwesB < -0.01) {
          transactions.push({
            from: personB,
            to: personA,
            amount: Math.round(Math.abs(aOwesB) * 100) / 100
          })
        }
      }
    }

    return transactions
  }

  const suggestedTransactions = calculateDirectDebts()

  // Dynamic real-time split custom calculation engine
  const getSplitValidation = () => {
    const totalAmount = parseFloat(expAmount) || 0
    let currentSum = 0
    roommates.forEach((r) => {
      currentSum += parseFloat(expCustomShares[r] || '0') || 0
    })

    if (expSplitType === 'percentage') {
      const isValid = Math.abs(currentSum - 100) <= 0.1
      const diff = 100 - currentSum
      return {
        isValid,
        text: isValid
          ? `✔ Perfect: Total equals exactly 100%!`
          : `⚡ Current Total: ${currentSum}% / 100% (${diff > 0 ? `${diff.toFixed(1)}% remaining` : `${Math.abs(diff).toFixed(1)}% over`})`
      }
    } else if (expSplitType === 'custom') {
      const isValid = Math.abs(currentSum - totalAmount) <= 0.05
      const diff = totalAmount - currentSum
      return {
        isValid,
        text: isValid
          ? `✔ Perfect: Total equals exactly ₹${totalAmount.toFixed(2)}!`
          : `⚡ Total Allocated: ₹${currentSum.toFixed(2)} / ₹${totalAmount.toFixed(2)} (${diff > 0 ? `₹${diff.toFixed(2)} remaining` : `₹${Math.abs(diff).toFixed(2)} over`})`
      }
    }

    return { isValid: true, text: '' }
  }

  const validation = getSplitValidation()

  if (!mounted) {
    return (
      <div style={{ color: '#2e2c28', padding: '30px', fontFamily: 'monospace' }}>
        Loading Ledger Portal...
      </div>
    )
  }

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="portal-header">
        <div className="portal-title-row">
          <div>
            <h1>FlatSplit 🏠⚡</h1>
            <p className="subtitle">Shared Expense Ledger &amp; Settlement System</p>
          </div>
          <div className="header-meta">
            <strong>Flat Ledger:</strong> {flatName} <br />
            <strong>Engine:</strong> Client-Side LocalStorage <br />
            {sessionAuthor && (
              <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                ✔ Session: <strong>{sessionAuthor}</strong> ({Math.ceil(sessionTimeLeft / 60)}m left){' '}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bulletin-toggle"
                  style={{ fontSize: '10px', marginLeft: '2px' }}
                >
                  [Logout]
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Beginner bulletin / instruction board */}
      {showHelp ? (
        <div className="bulletin-board">
          <div className="bulletin-title">
            <span>📌 Quick Help Guide (Beginner-Friendly)</span>
            <button type="button" onClick={() => setShowHelp(false)} className="bulletin-toggle">Hide Board [x]</button>
          </div>
          <div className="bulletin-content">
            <ol style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li><strong>Step 1:</strong> List of roommates is locked to the 5 active members: Ayush, Aman, Piyush, Prem, Vishal.</li>
              <li><strong>Step 2:</strong> Type your title, amount, select who paid, choose a split formulation, and click <i>Add Shared Expense</i>.</li>
              <li><strong>Step 3:</strong> Review balances. If someone owes money, click the <i>Auto-Fill</i> button in the <i>Smart Settle Guide</i> to automatically populate the settlement recorder!</li>
              <li><strong>🔒 Security Alert:</strong> To secure this ledger, all modifications require entering the password <strong><code>baroi</code></strong> and identifying which roommate is editing the record.</li>
              <li><strong>⚡ Session Cache:</strong> After entering the password once, it will remain authorized for **5 minutes of inactivity**, preventing repetitive password prompts!</li>
            </ol>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <button type="button" onClick={() => setShowHelp(true)} className="bulletin-toggle" style={{ fontSize: '12px' }}>Show Help [?]</button>
        </div>
      )}

      {/* SECTION 1: Flat Settings (LOCKED & READ-ONLY) */}
      <fieldset>
        <legend>
          <span className="step-badge">Step 1</span> Configurations (Locked)
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

      {/* SECTION 2: Operations forms */}
      <div className="row">
        {/* Add Shared Expense */}
        <div className="col-6">
          <fieldset style={{ height: '100%' }}>
            <legend>
              <span className="step-badge">Step 2</span> Record Shared Expense
            </legend>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label htmlFor="exp-title">Description / Title</label>
                <input
                  id="exp-title"
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Broadband, Rent, Groceries"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
                  <label htmlFor="exp-amount">Amount (₹)</label>
                  <input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
                  <label htmlFor="exp-payer">Paid By</label>
                  <select id="exp-payer" value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)} required>
                    {roommates.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
                  <label htmlFor="exp-category">Category</label>
                  <select id="exp-category" value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                    <option value="Food">Food</option>
                    <option value="Rent">Rent</option>
                    <option value="Electricity">Electricity</option>
                    <option value="WiFi">WiFi</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
                  <label htmlFor="exp-date">Date</label>
                  <input
                    id="exp-date"
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                <label>Split Formulation</label>
                <div style={{ display: 'flex', gap: '15px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', textTransform: 'none' }}>
                    <input
                      type="radio"
                      name="splitType"
                      checked={expSplitType === 'equal'}
                      onChange={() => setExpSplitType('equal')}
                      style={{ width: 'auto' }}
                    />
                    Equally
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', textTransform: 'none' }}>
                    <input
                      type="radio"
                      name="splitType"
                      checked={expSplitType === 'percentage'}
                      onChange={() => setExpSplitType('percentage')}
                      style={{ width: 'auto' }}
                    />
                    Percentages
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', textTransform: 'none' }}>
                    <input
                      type="radio"
                      name="splitType"
                      checked={expSplitType === 'custom'}
                      onChange={() => setExpSplitType('custom')}
                      style={{ width: 'auto' }}
                    />
                    Custom shares
                  </label>
                </div>
              </div>

              {/* Dynamic split input fields with real-time validator */}
              {expSplitType !== 'equal' && (
                <div style={{ backgroundColor: '#faf8f2', padding: '10px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>
                    Indicate {expSplitType === 'percentage' ? 'Percentage (%)' : 'Amount share (₹)'} for each:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {roommates.map((r) => (
                      <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label htmlFor={`custom-share-${r}`} style={{ margin: 0, textTransform: 'none' }}>{r}</label>
                        <input
                          id={`custom-share-${r}`}
                          type="number"
                          step="any"
                          value={expCustomShares[r] || ''}
                          onChange={(e) =>
                            setExpCustomShares({ ...expCustomShares, [r]: e.target.value })
                          }
                          placeholder="0"
                          style={{ width: '90px', textAlign: 'right', padding: '3px 6px' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={`validator-hint ${validation.isValid ? 'validator-valid' : 'validator-invalid'}`}>
                    {validation.text}
                  </div>
                </div>
              )}

              <div className="text-right" style={{ marginTop: '10px' }}>
                <button type="submit" className="btn-accent">Add Shared Expense 🔒</button>
              </div>
            </form>
          </fieldset>
        </div>

        {/* Record Settlement */}
        <div className="col-6" id="settle-section">
          <fieldset style={{ height: '100%' }}>
            <legend>
              <span className="step-badge">Step 3</span> Settle Up Payment
            </legend>
            <form onSubmit={handleAddSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="text-muted" style={{ marginBottom: '4px' }}>Log a direct cash or bank transfer payment between flatmates to offset existing debts.</p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
                  <label htmlFor="settle-payer">From (Payer)</label>
                  <select id="settle-payer" value={settleFrom} onChange={(e) => setSettleFrom(e.target.value)} required>
                    {roommates.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
                  <label htmlFor="settle-receiver">To (Recipient)</label>
                  <select id="settle-receiver" value={settleTo} onChange={(e) => setSettleTo(e.target.value)} required>
                    {roommates.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label htmlFor="settle-amount">Amount Settled (₹)</label>
                <input
                  id="settle-amount"
                  type="number"
                  step="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label htmlFor="settle-note">Note / Reference</label>
                <input
                  id="settle-note"
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="e.g. Settle balance, Cash, UPI Ref"
                />
              </div>

              <div className="text-right" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn-accent">Record Settlement 🔒</button>
              </div>
            </form>
          </fieldset>
        </div>
      </div>

      {/* SECTION 3: Balances & Guide */}
      <div className="row margin-top-20">
        {/* Balances List */}
        <div className="col-6">
          <fieldset style={{ height: '100%' }}>
            <legend>
              <span className="step-badge">Step 4</span> Active Net Balances
            </legend>
            <table border={1}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Net Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {roommates.map((name) => {
                  const balance = netBalances[name] || 0
                  const isCreditor = balance > 0
                  const isDebtor = balance < 0
                  return (
                    <tr key={name}>
                      <td><strong>{name}</strong></td>
                      <td>
                        <span className={`mono ${isCreditor ? 'text-success' : isDebtor ? 'text-danger' : ''}`}>
                          ₹{balance.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {isCreditor && <span className="text-success">To Collect</span>}
                        {isDebtor && <span className="text-danger">Owes Share</span>}
                        {Math.abs(balance) <= 0.01 && <span style={{ color: '#888' }}>Settled</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span className="text-muted">Total sum of all balances resolves to ₹0.</span>
              <button type="button" className="btn-danger" onClick={handleClearAll}>Clear All Data 🔒</button>
            </div>
          </fieldset>
        </div>

        {/* Suggested Actions */}
        <div className="col-6">
          <fieldset style={{ height: '100%' }}>
            <legend>
              <span className="step-badge">Step 5</span> Smart Settle Guide
            </legend>
            {suggestedTransactions.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', backgroundColor: '#faf8f2', border: '1px dashed #2e2c28' }}>
                <span className="text-success" style={{ fontSize: '13px' }}>✔ Everything is fully settled up! No transactions needed.</span>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '10px', fontSize: '13px' }}>Direct peer-to-peer relationships netting (does not route through third parties):</p>
                <ul style={{ paddingLeft: '15px' }}>
                  {suggestedTransactions.map((tx, idx) => (
                    <li key={idx}>
                      <strong>{tx.from}</strong> owes <strong>{tx.to}</strong>:{' '}
                      <span className="text-danger mono">₹{tx.amount.toFixed(2)}</span>{' '}
                      <button
                        type="button"
                        onClick={() => handleQuickSettle(tx.from, tx.to, tx.amount)}
                        style={{ padding: '2px 8px', fontSize: '10px', marginLeft: '6px' }}
                      >
                        Auto-Fill
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>
        </div>
      </div>

      {/* SECTION 4: Expense Ledger */}
      <fieldset className="margin-top-20">
        <legend>Shared Expense Registry</legend>
        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
            No expenses logged yet. Add a new shared expense using the form above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table border={1}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Total Amount</th>
                  <th>Paid By</th>
                  <th>Split Breakdown</th>
                  <th>Added By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.date}</td>
                    <td>
                      <span style={{ fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border-color)', backgroundColor: '#faf8f2' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td><strong>{exp.title}</strong></td>
                    <td><span className="mono">₹{exp.amount.toFixed(2)}</span></td>
                    <td><strong>{exp.paidBy}</strong></td>
                    <td style={{ fontSize: '12px' }}>
                      <span className="text-muted">
                        {Object.entries(exp.shares)
                          .map(([name, share]) => `${name}: ₹${share.toFixed(2)}`)
                          .join(', ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {exp.createdBy || 'Admin'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleDeleteExpense(exp.id)}
                        style={{ padding: '2px 8px', fontSize: '11px', boxShadow: 'none' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </fieldset>

      {/* SECTION 5: Settlement History Logs */}
      <fieldset className="margin-top-20">
        <legend>Settlement History Logs</legend>
        {settlements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
            No settlement payments recorded in ledger.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table border={1}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount Paid</th>
                  <th>Note</th>
                  <th>Added By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td><strong>{s.from}</strong></td>
                    <td><strong>{s.to}</strong></td>
                    <td><span className="text-success mono">₹{s.amount.toFixed(2)}</span></td>
                    <td><i>{s.note}</i></td>
                    <td>
                      <span style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {s.createdBy || 'Admin'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleDeleteSettlement(s.id)}
                        style={{ padding: '2px 8px', fontSize: '11px', boxShadow: 'none' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </fieldset>

      {/* Install Button & iOS instruction box at the bottom */}
      {showInstallBtn && (
        <fieldset className="margin-top-20" style={{ border: '2px solid var(--accent)' }}>
          <legend>📲 Download & Install App</legend>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px 0', textAlign: 'center' }}>
            <div>
              <strong>FlatSplit</strong> can be downloaded and run as a standalone desktop/mobile app!
            </div>
            <button 
              type="button" 
              onClick={handleInstallClick} 
              className="btn-success"
              style={{ padding: '6px 16px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Install FlatSplit
            </button>
            
            {showIOSHint && (
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                borderTop: '1px dashed var(--accent)',
                paddingTop: '8px',
                marginTop: '4px',
                width: '100%'
              }}>
                <strong>To Install on iOS (Safari):</strong> Tap the <strong>Share</strong> button (box with an up arrow ⎋) at the bottom/top of Safari, and select <strong>Add to Home Screen</strong>.
              </div>
            )}
          </div>
        </fieldset>
      )}

      {/* Audit-trail Statusbar displaying last activity */}
      <div className="statusbar">
        <div className="statusbar-field" style={{ flexGrow: 2 }}>
          <strong>Last Activity:</strong> {lastChangeAction} (by <strong>{lastChangeBy}</strong>)
        </div>
        <div className="statusbar-field">
          Roommates: {roommates.length}
        </div>
      </div>
    </div>
  )
}
