import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { ownerColors } from '../App'
import { useState } from 'react'

interface Task {
  id: string
  label: string
  start: string
  end: string
  owner: string
}

interface Subtask {
  id: string
  label: string
  weight: number
  description: string
}

interface ProgressManagerProps {
  tasks: Task[]
  progress: Record<string, number>
  subtaskProgress: Record<string, Record<string, boolean>>
  setSubtaskProgress: (progress: Record<string, Record<string, boolean>>) => void
  subtaskDefinitions: Record<string, Subtask[]>
  currentDate: string
  onCreateTask?: (taskData: { label: string; start: string; end: string; owner: string }) => void
  onDeleteTask?: (taskId: string) => void
}

const toDate = (s: string) => new Date(s)

export function ProgressManager({ 
  tasks, 
  progress, 
  subtaskProgress, 
  setSubtaskProgress,
  subtaskDefinitions,
  currentDate,
  onCreateTask,
  onDeleteTask
}: ProgressManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTaskLabel, setNewTaskLabel] = useState('')
  const [newTaskStart, setNewTaskStart] = useState(new Date().toISOString().slice(0, 10))
  const [newTaskEnd, setNewTaskEnd] = useState(new Date().toISOString().slice(0, 10))
  const [newTaskOwner, setNewTaskOwner] = useState('Leadership')
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const currentTaskProgress = subtaskProgress[taskId] || {}
    const updated = {
      ...subtaskProgress,
      [taskId]: {
        ...currentTaskProgress,
        [subtaskId]: !currentTaskProgress[subtaskId]
      }
    }
    setSubtaskProgress(updated)
  }

  const toggleAllSubtasks = (taskId: string, checked: boolean) => {
    const subtasks = subtaskDefinitions[taskId] || []
    const updated = {
      ...subtaskProgress,
      [taskId]: Object.fromEntries(subtasks.map(st => [st.id, checked]))
    }
    setSubtaskProgress(updated)
  }

  const resetProgress = () => {
    setSubtaskProgress({})
  }

  const filteredTasks = tasks.filter(task => {
    // Only show tasks that have subtasks defined
    if (!subtaskDefinitions[task.id]) return false
    
    return task.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.owner.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getTaskStatus = (task: Task) => {
    const taskProgress = progress[task.id] || 0
    const today = toDate(currentDate)
    const start = toDate(task.start)
    const end = toDate(task.end)

    if (taskProgress === 100) return { label: 'Completed', variant: 'default' as const }
    if (today < start) return { label: 'Not Started', variant: 'secondary' as const }
    if (today > end) return { label: 'Overdue', variant: 'destructive' as const }
    return { label: 'In Progress', variant: 'outline' as const }
  }

  const ownerColors: Record<string, string> = {
    'Leadership': 'from-purple-500 to-violet-500',
    'Marketing': 'from-blue-500 to-indigo-500',
    'Design': 'from-pink-500 to-rose-500',
    'Product': 'from-green-500 to-emerald-500',
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Progress Management</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetProgress} 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Reset All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <Accordion type="multiple" className="space-y-3">
            {filteredTasks.map((task) => {
              const status = getTaskStatus(task)
              const taskProgress = progress[task.id] || 0
              const subtasks = subtaskDefinitions[task.id] || []
              const completed = subtaskProgress[task.id] || {}
              const completedCount = subtasks.filter(st => completed[st.id]).length

              return (
                <AccordionItem 
                  key={task.id} 
                  value={task.id}
                  className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border shadow-sm"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center justify-between gap-4 w-full pr-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={status.variant} className="shadow-sm">
                            {status.label}
                          </Badge>
                          <span className="text-sm">{task.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.start).toLocaleDateString()} → {new Date(task.end).toLocaleDateString()} • {task.owner}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedCount} of {subtasks.length} subtasks complete
                        </p>
                      </div>
                      <div className={`text-right px-4 py-2 rounded-lg bg-gradient-to-r ${ownerColors[task.owner] || 'from-slate-500 to-gray-500'} text-white shadow-md`}>
                        <div className="text-3xl">{taskProgress}%</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm">Subtasks:</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAllSubtasks(task.id, true)}
                            className="text-xs"
                          >
                            Check All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAllSubtasks(task.id, false)}
                            className="text-xs"
                          >
                            Uncheck All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {subtasks.map((subtask) => (
                          <div 
                            key={subtask.id}
                            className="flex flex-col p-3 bg-white rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() => toggleSubtask(task.id, subtask.id)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  id={`${task.id}-${subtask.id}`}
                                  checked={completed[subtask.id] || false}
                                  onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                                  className="w-5 h-5 pointer-events-none"
                                />
                                <Label 
                                  htmlFor={`${task.id}-${subtask.id}`}
                                  className="cursor-pointer flex-1 pointer-events-none"
                                >
                                  {subtask.label}
                                </Label>
                              </div>
                              <Badge variant="secondary" className="text-xs pointer-events-none">
                                {Math.round(subtask.weight * 100)}% weight
                              </Badge>
                            </div>
                            {subtask.description && (
                              <p className="text-xs text-muted-foreground mt-2 ml-11 pointer-events-none">
                                {subtask.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <Progress value={taskProgress} className="h-3 mt-4" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks with subtasks found.</p>
              <p className="text-sm mt-2">Tasks without subtasks are tracked at the task level.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
