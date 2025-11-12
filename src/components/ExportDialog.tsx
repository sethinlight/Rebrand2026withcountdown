import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Code } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { toast } from 'sonner@2.0.3'

interface Task {
  id: string
  label: string
  start: string
  end: string
  owner: string
  offset?: number
  length?: number
}

interface ExportDialogProps {
  tasks: Task[]
  progress: Record<string, number>
  version: string
}

export function ExportDialog({ tasks, progress, version }: ExportDialogProps) {
  const [open, setOpen] = useState(false)

  const exportToCSV = () => {
    const headers = ['Task', 'Start Date', 'End Date', 'Duration (days)', 'Owner', 'Progress (%)']
    const rows = tasks.map(task => [
      task.label,
      task.start,
      task.end,
      task.length || 0,
      task.owner,
      progress[task.id] || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `brand-rebuild-v${version}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('CSV exported successfully')
    setOpen(false)
  }

  const exportToPDF = async () => {
    try {
      // Dynamic import for PDF generation
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF('l', 'mm', 'a4')
      
      // Title
      doc.setFontSize(18)
      doc.text(`Brand Rebuild - Version ${version}`, 15, 15)
      
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 22)
      
      // Summary stats
      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => (progress[t.id] || 0) === 100).length
      const avgProgress = Math.round(tasks.reduce((sum, t) => sum + (progress[t.id] || 0), 0) / totalTasks)
      
      doc.setFontSize(12)
      doc.text(`Summary: ${completedTasks}/${totalTasks} tasks completed (${avgProgress}% overall)`, 15, 30)
      
      // Table headers
      doc.setFontSize(9)
      let y = 40
      const colWidths = [80, 25, 25, 20, 40, 15]
      const headers = ['Task', 'Start', 'End', 'Days', 'Owner', 'Progress']
      
      doc.setFillColor(59, 130, 246)
      doc.setTextColor(255, 255, 255)
      doc.rect(15, y - 5, 270, 7, 'F')
      
      let x = 15
      headers.forEach((header, i) => {
        doc.text(header, x + 2, y)
        x += colWidths[i]
      })
      
      // Table rows
      doc.setTextColor(0, 0, 0)
      y += 8
      
      tasks.forEach((task, idx) => {
        if (y > 190) { // New page if needed
          doc.addPage()
          y = 15
        }
        
        // Alternate row colors
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(15, y - 5, 270, 7, 'F')
        }
        
        x = 15
        const row = [
          task.label.substring(0, 50),
          task.start,
          task.end,
          (task.length || 0).toString(),
          task.owner.substring(0, 25),
          `${progress[task.id] || 0}%`
        ]
        
        doc.setFontSize(8)
        row.forEach((cell, i) => {
          doc.text(cell, x + 2, y)
          x += colWidths[i]
        })
        
        y += 7
      })
      
      doc.save(`brand-rebuild-v${version}-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported successfully')
      setOpen(false)
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Failed to export PDF')
    }
  }

  const exportSourceCode = () => {
    const message = `
To export the source code of this application:

1. **View Source in Browser:**
   - Right-click on the page and select "View Page Source"
   - Or press Ctrl+U (Windows/Linux) or Cmd+Option+U (Mac)

2. **Using Browser DevTools:**
   - Open DevTools (F12 or Right-click > Inspect)
   - Go to the "Sources" tab to see all files
   - Navigate to view individual component files

3. **Copy Application State:**
   - Your progress data is saved in browser localStorage
   - Open DevTools > Application tab > Local Storage
   - Keys: 'subtaskProgress' and 'categoryColors'

4. **For Full Project Files:**
   This is a React + TypeScript application built with:
   - React 18 with TypeScript
   - Tailwind CSS v4
   - Shadcn/UI components
   - All code is visible in browser DevTools

Note: This app runs entirely in your browser. All your data
is stored locally and persists across sessions.
    `
    
    toast.info('Source Code Info', {
      description: message,
      duration: 10000,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Project Data</DialogTitle>
          <DialogDescription>
            Choose a format to export the current project timeline and progress data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button onClick={exportToCSV} variant="outline" className="justify-start h-auto py-4">
            <FileSpreadsheet className="h-5 w-5 mr-3 text-green-600" />
            <div className="text-left">
              <div>Export as CSV</div>
              <div className="text-xs text-muted-foreground">
                Spreadsheet format for Excel, Google Sheets, etc.
              </div>
            </div>
          </Button>
          
          <Button onClick={exportToPDF} variant="outline" className="justify-start h-auto py-4">
            <FileText className="h-5 w-5 mr-3 text-red-600" />
            <div className="text-left">
              <div>Export as PDF</div>
              <div className="text-xs text-muted-foreground">
                Printable document with full task list and progress
              </div>
            </div>
          </Button>

          <Button onClick={exportSourceCode} variant="outline" className="justify-start h-auto py-4">
            <Code className="h-5 w-5 mr-3 text-blue-600" />
            <div className="text-left">
              <div>View Source Code</div>
              <div className="text-xs text-muted-foreground">
                Instructions for viewing and accessing the application code
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
