import { useMemo, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ReferenceLine, Cell } from 'recharts'
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { categoryLabels } from '../App'

interface Task {
  id: string
  label: string
  start: string
  end: string
  owner: string
  offset: number
  length: number
  category?: string
}

interface Subtask {
  id: string
  label: string
  weight: number
  description: string
}

interface GanttViewProps {
  tasks: Task[]
  progress: Record<string, number>
  kickoff: string
  endDate: string
  currentDate: string
  milestones?: { date: string; label: string }[]
  categoryColors: Record<string, string>
  onUpdateTask?: (taskId: string, updates: { start?: string; end?: string; owner?: string; label?: string }) => void
  onCreateTask?: (taskData: { label: string; start: string; end: string; owner: string; category?: string }) => void
  onDeleteTask?: (taskId: string) => void
  onResetTimelines?: () => void
  hasOverrides?: boolean
  subtaskDefinitions?: Record<string, Subtask[]>
  subtaskProgress?: Record<string, Record<string, boolean>>
}

const toDate = (s: string) => new Date(s)
const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / (1000 * 60 * 60 * 24))
const addDays = (s: string, d: number) => new Date(toDate(s).getTime() + d * 86400000).toISOString().slice(0, 10)

export function GanttView({ tasks, progress, kickoff, endDate, currentDate, milestones = [], categoryColors, onUpdateTask, onCreateTask, onDeleteTask, onResetTimelines, hasOverrides, subtaskDefinitions = {}, subtaskProgress = {} }: GanttViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editOwner, setEditOwner] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTaskLabel, setNewTaskLabel] = useState('')
  const [newTaskStart, setNewTaskStart] = useState(kickoff)
  const [newTaskEnd, setNewTaskEnd] = useState(kickoff)
  const [newTaskOwner, setNewTaskOwner] = useState('Leadership')
  const [newTaskCategory, setNewTaskCategory] = useState<string>('none')
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  
  // Timeline zoom state
  const [viewRange, setViewRange] = useState<'full' | '3months' | '6months' | 'custom'>('full')
  const [customStartDate, setCustomStartDate] = useState(kickoff)
  const [customEndDate, setCustomEndDate] = useState(endDate)

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setEditStart(task.start)
    setEditEnd(task.end)
    setEditOwner(task.owner)
    setEditLabel(task.label)
  }

  const saveEdit = () => {
    if (editingTask && onUpdateTask) {
      onUpdateTask(editingTask.id, {
        start: editStart,
        end: editEnd,
        owner: editOwner,
        label: editLabel
      })
      toast.success(`Updated task "${editLabel}"`, {
        description: `Owner: ${editOwner} | Dates: ${new Date(editStart).toLocaleDateString()} - ${new Date(editEnd).toLocaleDateString()}`
      })
    }
    setEditingTask(null)
  }

  const handleCreateTask = () => {
    if (!newTaskLabel.trim()) {
      toast.error('Please enter a task name')
      return
    }
    if (onCreateTask) {
      const categoryValue = newTaskCategory === 'none' ? undefined : newTaskCategory
      onCreateTask({
        label: newTaskLabel,
        start: newTaskStart,
        end: newTaskEnd,
        owner: newTaskOwner,
        category: categoryValue
      })
      const categoryInfo = categoryValue ? ` | ${categoryLabels[categoryValue]}` : ''
      toast.success(`Created task "${newTaskLabel}"`, {
        description: `Owner: ${newTaskOwner}${categoryInfo} | ${new Date(newTaskStart).toLocaleDateString()} - ${new Date(newTaskEnd).toLocaleDateString()}`
      })
      // Reset form
      setNewTaskLabel('')
      setNewTaskStart(kickoff)
      setNewTaskEnd(kickoff)
      setNewTaskOwner('Leadership')
      setNewTaskCategory('none')
      setIsCreateDialogOpen(false)
    }
  }

  const confirmDelete = () => {
    if (taskToDelete && onDeleteTask) {
      onDeleteTask(taskToDelete.id)
      toast.success(`Deleted task "${taskToDelete.label}"`)
      setTaskToDelete(null)
    }
  }

  // Calculate visible date range based on view mode
  const { visibleStart, visibleEnd } = useMemo(() => {
    const today = toDate(currentDate)
    
    switch (viewRange) {
      case '3months':
        // Show 0 month before today and 3 months after
        const threeMonthStart = new Date(today.getFullYear(), today.getMonth() +0, 1)
        const threeMonthEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0)
        return {
          visibleStart: threeMonthStart.toISOString().slice(0, 10),
          visibleEnd: threeMonthEnd.toISOString().slice(0, 10)
        }
      case '6months':
        // Show 0 months before today and 5 months after
        const sixMonthStart = new Date(today.getFullYear(), today.getMonth() + 0, 1)
        const sixMonthEnd = new Date(today.getFullYear(), today.getMonth() + 5, 0)
        return {
          visibleStart: sixMonthStart.toISOString().slice(0, 10),
          visibleEnd: sixMonthEnd.toISOString().slice(0, 10)
        }
      case 'custom':
        return {
          visibleStart: customStartDate,
          visibleEnd: customEndDate
        }
      case 'full':
      default:
        return {
          visibleStart: kickoff,
          visibleEnd: endDate
        }
    }
  }, [viewRange, currentDate, kickoff, endDate, customStartDate, customEndDate])

  const visibleStartOffset = useMemo(() => daysBetween(kickoff, visibleStart), [kickoff, visibleStart])
  const visibleEndOffset = useMemo(() => daysBetween(kickoff, visibleEnd), [kickoff, visibleEnd])

  const xTicks = useMemo(() => {
    const ticks = []
    const start = toDate(visibleStart)
    const end = toDate(visibleEnd)
    
    // Generate ticks for the 1st of each month in visible range
    let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1)
    
    while (currentMonth <= end) {
      const dayOffset = daysBetween(kickoff, currentMonth.toISOString().slice(0, 10))
      if (dayOffset >= visibleStartOffset && dayOffset <= visibleEndOffset) {
        ticks.push(dayOffset)
      }
      
      // Move to next month
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    }
    
    return ticks
  }, [kickoff, visibleStart, visibleEnd, visibleStartOffset, visibleEndOffset])

  const currentDayOffset = useMemo(() => {
    return daysBetween(kickoff, currentDate)
  }, [kickoff, currentDate])

  // Owner-based color mapping (distinct from status colors)
  const ownerColors: Record<string, string> = {
    'Leadership': '#7c3aed', // Deep Purple
    'Marketing': '#f59e0b', // Amber/Orange
    'Design': '#ec4899',     // Pink
    'Product': '#06b6d4',    // Cyan/Teal
  }
  
  // Status colors (distinct from owner colors)
  const statusColors = {
    'completed': '#10b981',    // Green
    'in-progress': '#3b82f6',  // Blue
    'not-started': '#6b7280',  // Gray
    'overdue': '#ef4444',      // Red
  }

  // Filter tasks based on visible date range
  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskStart = toDate(task.start)
      const taskEnd = toDate(task.end)
      const rangeStart = toDate(visibleStart)
      const rangeEnd = toDate(visibleEnd)
      
      // Include task if it overlaps with visible range at all
      return taskEnd >= rangeStart && taskStart <= rangeEnd
    })
  }, [tasks, visibleStart, visibleEnd])

  const enrichedTasks = useMemo(() => {
    return visibleTasks.map(task => {
      const taskProgress = progress[task.id] || 0
      const today = toDate(currentDate)
      const start = toDate(task.start)
      const end = toDate(task.end)
      
      let status = 'not-started'
      if (taskProgress === 100) {
        status = 'completed'
      } else if (today >= start && today <= end) {
        status = 'in-progress'
      } else if (today > end) {
        status = 'overdue'
      }

      // Assign color based on owner
      const color = ownerColors[task.owner] || '#94a3b8'

      // Clip the task bar to visible range
      let clippedOffset = task.offset
      let clippedLength = task.length
      const taskStartOffset = task.offset
      const taskEndOffset = task.offset + task.length

      // If task starts before visible range, clip the start
      if (taskStartOffset < visibleStartOffset) {
        clippedOffset = visibleStartOffset
        clippedLength = taskEndOffset - visibleStartOffset
      }

      // If task ends after visible range, clip the end
      if (taskEndOffset > visibleEndOffset) {
        clippedLength = visibleEndOffset - clippedOffset
      }

      // Ensure length is at least 1 day for visibility
      clippedLength = Math.max(1, clippedLength)

      return { 
        ...task, 
        offset: clippedOffset, 
        length: clippedLength, 
        status, 
        progress: taskProgress, 
        color 
      }
    })
  }, [visibleTasks, progress, currentDate, visibleStartOffset, visibleEndOffset])

  const getBarColor = (status: string) => {
    switch (status) {
      case 'completed': return statusColors.completed
      case 'in-progress': return statusColors['in-progress']
      case 'overdue': return statusColors.overdue
      case 'not-started': return statusColors['not-started']
      default: return '#94a3b8'
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Project Timeline
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gantt chart showing all tasks, durations, and current status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border rounded-lg p-1 bg-white shadow-sm">
              <Select value={viewRange} onValueChange={(value: any) => setViewRange(value)}>
                <SelectTrigger className="w-[140px] h-8 text-xs border-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Timeline</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {onUpdateTask && (
              <>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={isEditMode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : ""}
                >
                  {isEditMode ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Close Edit Mode
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Timelines
                    </>
                  )}
                </Button>
                {hasOverrides && onResetTimelines && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Reset all timeline edits to original dates?')) {
                        onResetTimelines()
                        toast.success('All timeline edits have been reset')
                      }
                    }}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Reset All Edits
                  </Button>
                )}
              </>
            )}
            {onCreateTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 hover:from-blue-600 hover:to-indigo-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        </div>

        {viewRange !== 'full' && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between gap-4">
            {viewRange === 'custom' ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">From:</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">To:</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Viewing {Math.round(daysBetween(visibleStart, visibleEnd))} days • {visibleTasks.length} of {tasks.length} tasks
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">
                Showing {visibleTasks.length} of {tasks.length} tasks in selected time range ({Math.round(daysBetween(visibleStart, visibleEnd))} days)
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs bg-slate-50 p-3 rounded-lg border mb-6">
            <div className="flex items-center gap-2 font-semibold">
              Status:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: statusColors.completed }}></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: statusColors['in-progress'] }}></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: statusColors.overdue }}></div>
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: statusColors['not-started'] }}></div>
              <span>Not Started</span>
            </div>
            
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            <div className="flex items-center gap-2 font-semibold">
              Owner:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: ownerColors.Leadership }}></div>
              <span>Leadership</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: ownerColors.Marketing }}></div>
              <span>Marketing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: ownerColors.Design }}></div>
              <span>Design</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: ownerColors.Product }}></div>
              <span>Product</span>
            </div>
            
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            <div className="flex items-center gap-2 font-semibold">
              Category:
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: categoryColors.website }}></div>
              <span>Website</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: categoryColors.tradeshow }}></div>
              <span>Tradeshow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: categoryColors.templates }}></div>
              <span>Templates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: categoryColors['visual-assets'] }}></div>
              <span>Visual Assets</span>
            </div>
          </div>

        {isEditMode && onUpdateTask && (
          <div className="mb-6 max-h-96 overflow-y-auto border rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <tr>
                  <th className="text-left p-3 border-b">Task</th>
                  <th className="text-left p-3 border-b">Owner</th>
                  <th className="text-left p-3 border-b">Start Date</th>
                  <th className="text-left p-3 border-b">End Date</th>
                  <th className="text-center p-3 border-b">Duration (days)</th>
                  <th className="text-center p-3 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-b">
                      <div className="flex items-center gap-2">
                        {task.label}
                        {task.category && (
                          <Badge 
                            style={{ backgroundColor: categoryColors[task.category] }} 
                            className="text-white border-0 text-xs"
                          >
                            {categoryLabels[task.category]}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-b">
                      <Badge style={{ backgroundColor: ownerColors[task.owner] || '#94a3b8' }} className="text-white border-0">
                        {task.owner}
                      </Badge>
                    </td>
                    <td className="p-3 border-b">{new Date(task.start).toLocaleDateString()}</td>
                    <td className="p-3 border-b">{new Date(task.end).toLocaleDateString()}</td>
                    <td className="p-3 border-b text-center">{task.length}</td>
                    <td className="p-3 border-b text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(task)}
                          className="hover:bg-emerald-50 hover:border-emerald-500"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        {onDeleteTask && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTaskToDelete(task)}
                            className="hover:bg-red-50 hover:border-red-500 text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ResponsiveContainer width="100%" height={Math.max(600, enrichedTasks.length * 40)}>
          <BarChart data={enrichedTasks} layout="vertical" margin={{ top: 10, right: 20, left: 240, bottom: 10 }}>
            <XAxis 
              type="number" 
              domain={[visibleStartOffset, visibleEndOffset]} 
              ticks={xTicks} 
              tickFormatter={(d) => {
                const labelDate = addDays(kickoff, d)
                const dt = new Date(labelDate)
                return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }} 
            />
            <YAxis 
              type="category" 
              dataKey="label" 
              width={240}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '12px'
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const task = payload[0].payload
                  const subtasks = subtaskDefinitions[task.id] || []
                  const completed = subtaskProgress[task.id] || {}
                  const hasSubtasks = subtasks.length > 0
                  
                  return (
                    <div className="bg-white/95 p-4 rounded-lg shadow-xl border max-w-md">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="font-semibold">{task.label}</p>
                        <Badge 
                          style={{ backgroundColor: task.color }} 
                          className="text-white border-0 shrink-0"
                        >
                          {task.owner}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20">Start:</span>
                          <span>{new Date(task.start).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20">End:</span>
                          <span>{new Date(task.end).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20">Duration:</span>
                          <span>{task.length} days</span>
                        </div>
                        {task.category && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-20">Category:</span>
                            <Badge 
                              style={{ backgroundColor: categoryColors[task.category] }} 
                              className="text-white border-0 text-xs"
                            >
                              {categoryLabels[task.category]}
                            </Badge>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20">Progress:</span>
                          <span className="font-semibold">{task.progress}%</span>
                        </div>
                      </div>

                      {hasSubtasks && (
                        <>
                          <div className="border-t pt-3 mt-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              TASK BREAKDOWN ({Object.values(completed).filter(Boolean).length}/{subtasks.length} complete)
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {subtasks.map((subtask) => (
                                <div 
                                  key={subtask.id} 
                                  className={`text-xs p-2 rounded ${
                                    completed[subtask.id] 
                                      ? 'bg-green-50 border border-green-200' 
                                      : 'bg-slate-50 border border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-2 mb-1">
                                    <div className={`w-4 h-4 rounded-sm shrink-0 mt-0.5 flex items-center justify-center ${
                                      completed[subtask.id] 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-white border-2 border-slate-300'
                                    }`}>
                                      {completed[subtask.id] && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className={`font-medium ${completed[subtask.id] ? 'line-through text-green-700' : ''}`}>
                                          {subtask.label}
                                        </span>
                                        <span className="text-muted-foreground shrink-0">
                                          {Math.round(subtask.weight * 100)}%
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground mt-1 leading-tight">
                                        {subtask.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            
            {/* Today marker */}
            <ReferenceLine 
              x={currentDayOffset} 
              stroke="#f59e0b" 
              strokeWidth={3}
              strokeDasharray="5 5"
              label={{ 
                value: 'Today', 
                position: 'top', 
                fill: '#f59e0b', 
                fontSize: 14,
                fontWeight: 'bold'
              }}
            />

            {/* Offset bar (transparent) to push the duration bar */}
            <Bar dataKey="offset" stackId="a" fill="rgba(0,0,0,0)" barSize={28} />
            
            {/* Duration bar with dynamic color based on owner/status */}
            <Bar dataKey="length" stackId="a" radius={[0, 8, 8, 0]} barSize={28} shape={(props: any) => {
              const { x, y, width, height, payload } = props
              const task = payload
              const categoryColor = task.category ? categoryColors[task.category] : null
              
              return (
                <g>
                  {/* Main bar */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={task.color}
                    rx={8}
                    ry={8}
                  />
                  {/* Category indicator stripe on left edge */}
                  {categoryColor && (
                    <rect
                      x={x}
                      y={y}
                      width={6}
                      height={height}
                      fill={categoryColor}
                      rx={8}
                      ry={8}
                    />
                  )}
                  {/* Owner label */}
                  <text
                    x={x + width - 8}
                    y={y + height / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={11}
                    fontWeight="500"
                  >
                    {task.owner}
                  </text>
                </g>
              )
            }}>
              {enrichedTasks.map((task, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {milestones && milestones.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border">
            <span className="text-sm mb-3 block">Key Milestones:</span>
            <div className="flex flex-wrap gap-2">
              {milestones.map((m, idx) => {
                const colors = [
                  'bg-gradient-to-r from-green-500 to-emerald-500',
                  'bg-gradient-to-r from-blue-500 to-cyan-500',
                  'bg-gradient-to-r from-purple-500 to-pink-500',
                  'bg-gradient-to-r from-orange-500 to-red-500',
                  'bg-gradient-to-r from-indigo-500 to-purple-500',
                  'bg-gradient-to-r from-teal-500 to-green-500',
                  'bg-gradient-to-r from-pink-500 to-rose-500',
                ]
                return (
                  <Badge key={m.date} className={`${colors[idx % colors.length]} text-white border-0 shadow-md px-3 py-1`}>
                    {m.label}: {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task: {editingTask.label}</DialogTitle>
              <DialogDescription>
                Update the task title, owner, start date, and end date.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Enter task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Select value={editOwner} onValueChange={setEditOwner}>
                  <SelectTrigger id="owner">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leadership">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Leadership }}></div>
                        Leadership
                      </div>
                    </SelectItem>
                    <SelectItem value="Marketing">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Marketing }}></div>
                        Marketing
                      </div>
                    </SelectItem>
                    <SelectItem value="Design">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Design }}></div>
                        Design
                      </div>
                    </SelectItem>
                    <SelectItem value="Product">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Product }}></div>
                        Product
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded">
                <p><span className="font-semibold">Original Owner:</span> {editingTask.owner}</p>
                <p><span className="font-semibold">Current Duration:</span> {editingTask.length} days</p>
                <p><span className="font-semibold">New Duration:</span> {Math.max(1, daysBetween(editStart, editEnd))} days</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the project timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-task-title">Task Title</Label>
              <Input
                id="new-task-title"
                type="text"
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                placeholder="Enter task name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-owner">Owner</Label>
              <Select value={newTaskOwner} onValueChange={setNewTaskOwner}>
                <SelectTrigger id="new-owner">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Leadership">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Leadership }}></div>
                      Leadership
                    </div>
                  </SelectItem>
                  <SelectItem value="Marketing">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Marketing }}></div>
                      Marketing
                    </div>
                  </SelectItem>
                  <SelectItem value="Design">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Design }}></div>
                      Design
                    </div>
                  </SelectItem>
                  <SelectItem value="Product">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: ownerColors.Product }}></div>
                      Product
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category">Category (Optional)</Label>
              <Select value={newTaskCategory || "none"} onValueChange={(val) => setNewTaskCategory(val === "none" ? "" : val)}>
                <SelectTrigger id="new-category">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  <SelectItem value="website">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: categoryColors.website }}></div>
                      Website
                    </div>
                  </SelectItem>
                  <SelectItem value="tradeshow">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: categoryColors.tradeshow }}></div>
                      Tradeshow
                    </div>
                  </SelectItem>
                  <SelectItem value="templates">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: categoryColors.templates }}></div>
                      Templates
                    </div>
                  </SelectItem>
                  <SelectItem value="visual-assets">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: categoryColors['visual-assets'] }}></div>
                      Visual Assets
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-start-date">Start Date</Label>
              <Input
                id="new-start-date"
                type="date"
                value={newTaskStart}
                onChange={(e) => setNewTaskStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-end-date">End Date</Label>
              <Input
                id="new-end-date"
                type="date"
                value={newTaskEnd}
                onChange={(e) => setNewTaskEnd(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded">
              <p><span className="font-semibold">Duration:</span> {Math.max(1, daysBetween(newTaskStart, newTaskEnd))} days</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
