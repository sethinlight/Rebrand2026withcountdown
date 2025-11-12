import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'

interface Task {
  id: string
  label: string
  start: string
  end: string
  owner: string
}

interface OwnerViewProps {
  tasks: Task[]
  progress: Record<string, number>
  currentDate: string
}

const toDate = (s: string) => new Date(s)

export function OwnerView({ tasks, progress, currentDate }: OwnerViewProps) {
  const groupedByOwner = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    
    tasks.forEach(task => {
      const owner = task.owner
      if (!groups[owner]) {
        groups[owner] = []
      }
      groups[owner].push(task)
    })

    return Object.entries(groups).map(([owner, ownerTasks]) => {
      const totalProgress = ownerTasks.reduce((sum, t) => sum + (progress[t.id] || 0), 0)
      const avgProgress = Math.round(totalProgress / ownerTasks.length)
      
      const completed = ownerTasks.filter(t => (progress[t.id] || 0) === 100).length
      const today = toDate(currentDate)
      const overdue = ownerTasks.filter(t => {
        const end = toDate(t.end)
        return today > end && (progress[t.id] || 0) < 100
      }).length

      return {
        owner,
        tasks: ownerTasks.sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime()),
        avgProgress,
        completed,
        total: ownerTasks.length,
        overdue
      }
    }).sort((a, b) => a.owner.localeCompare(b.owner))
  }, [tasks, progress, currentDate])

  const getTaskStatus = (task: Task) => {
    const taskProgress = progress[task.id] || 0
    const today = toDate(currentDate)
    const start = toDate(task.start)
    const end = toDate(task.end)

    if (taskProgress === 100) return { label: 'Completed', variant: 'default' as const, color: 'text-green-600' }
    if (today < start) return { label: 'Not Started', variant: 'secondary' as const, color: 'text-slate-600' }
    if (today > end) return { label: 'Overdue', variant: 'destructive' as const, color: 'text-red-600' }
    return { label: 'In Progress', variant: 'outline' as const, color: 'text-blue-600' }
  }

  const ownerGradients: Record<string, string> = {
    'Leadership': 'from-purple-500 to-violet-500',
    'Marketing': 'from-blue-500 to-indigo-500',
    'Design': 'from-pink-500 to-rose-500',
    'Product': 'from-green-500 to-emerald-500',
  }

  return (
    <div className="space-y-4">
      {groupedByOwner.map(({ owner, tasks, avgProgress, completed, total, overdue }) => {
        const gradient = ownerGradients[owner] || 'from-slate-500 to-gray-500'
        
        return (
          <Card key={owner} className="bg-white/80 backdrop-blur shadow-lg border-0">
            <CardHeader className={`bg-gradient-to-r ${gradient} text-white rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{owner}</CardTitle>
                <div className="flex items-center gap-3">
                  {overdue > 0 && (
                    <Badge className="bg-red-600 border-0 shadow-md text-white">{overdue} overdue</Badge>
                  )}
                  <Badge className="bg-white/20 border-0 backdrop-blur text-white shadow-md">{completed}/{total} completed</Badge>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-3 py-1">
                    <Progress value={avgProgress} className="w-24 h-2 bg-white/30" />
                    <span className="text-sm text-white">{avgProgress}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="multiple" className="w-full">
              {tasks.map(task => {
                const status = getTaskStatus(task)
                const taskProgress = progress[task.id] || 0
                return (
                  <AccordionItem key={task.id} value={task.id} className="border-b last:border-0">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between flex-1 mr-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant={status.variant} className="shadow-sm">
                            {status.label}
                          </Badge>
                          <span className="text-sm text-left">{task.label}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-full px-3 py-1">
                          <Progress value={taskProgress} className="w-24 h-2.5" />
                          <span className="text-sm w-10 text-right">{taskProgress}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 pt-3 pb-2 space-y-2 text-sm bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-medium">{new Date(task.start).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">End Date:</span>
                            <span className="font-medium">{new Date(task.end).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">
                              {Math.round((toDate(task.end).getTime() - toDate(task.start).getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="font-medium">{taskProgress}% complete</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
