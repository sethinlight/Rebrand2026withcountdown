import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Calendar, Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'
import { ownerColors } from '../App'

interface Task {
  id: string
  label: string
  start: string
  end: string
  owner: string
  category?: string
}

interface CountdownTrackerProps {
  tasks: Task[]
  currentDate: string
  progress: Record<string, number>
}

const toDate = (s: string) => new Date(s)

const daysBetween = (a: string, b: string) =>
  Math.round(
    (toDate(b).getTime() - toDate(a).getTime()) /
      (1000 * 60 * 60 * 24),
  )

export function CountdownTracker({ tasks, currentDate, progress }: CountdownTrackerProps) {
  // Calculate countdown data for each task
  const tasksWithCountdown = tasks.map(task => {
    const daysUntilStart = daysBetween(currentDate, task.start)
    const daysUntilEnd = daysBetween(currentDate, task.end)
    const taskProgress = progress[task.id] || 0
    const duration = daysBetween(task.start, task.end)
    
    let status: 'upcoming' | 'in-progress' | 'completed' | 'overdue'
    let countdown: number
    let message: string
    
    if (taskProgress === 100) {
      status = 'completed'
      countdown = 0
      message = 'Completed'
    } else if (daysUntilStart > 0) {
      status = 'upcoming'
      countdown = daysUntilStart
      message = `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`
    } else if (daysUntilEnd >= 0) {
      status = 'in-progress'
      countdown = daysUntilEnd
      message = `${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''} remaining`
    } else {
      status = 'overdue'
      countdown = Math.abs(daysUntilEnd)
      message = `${Math.abs(daysUntilEnd)} day${Math.abs(daysUntilEnd) !== 1 ? 's' : ''} overdue`
    }
    
    return {
      ...task,
      daysUntilStart,
      daysUntilEnd,
      duration,
      status,
      countdown,
      message,
      taskProgress
    }
  })
  
  // Sort by start date (soonest first)
  const sortedTasks = tasksWithCountdown.sort((a, b) => {
    return toDate(a.start).getTime() - toDate(b.start).getTime()
  })
  
  // Group tasks by status
  const upcomingTasks = sortedTasks.filter(t => t.status === 'upcoming')
  const inProgressTasks = sortedTasks.filter(t => t.status === 'in-progress')
  const overdueTasks = sortedTasks.filter(t => t.status === 'overdue')
  const completedTasks = sortedTasks.filter(t => t.status === 'completed')
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-4 h-4" />
      case 'in-progress':
        return <PlayCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500'
      case 'in-progress':
        return 'bg-amber-500'
      case 'completed':
        return 'bg-emerald-500'
      case 'overdue':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }
  
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'overdue':
        return 'destructive'
      default:
        return 'outline'
    }
  }
  
  const renderTaskCard = (task: typeof sortedTasks[0]) => (
    <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 ${getStatusColor(task.status)}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status)}
              <h3 className="font-medium">{task.label}</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusBadgeVariant(task.status)} className="gap-1">
                {task.status === 'upcoming' && <Clock className="w-3 h-3" />}
                {task.status === 'in-progress' && <PlayCircle className="w-3 h-3" />}
                {task.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {task.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                {task.message}
              </Badge>
              
              <Badge 
                variant="secondary" 
                style={{ 
                  backgroundColor: `${ownerColors[task.owner]}20`,
                  color: ownerColors[task.owner],
                  borderColor: ownerColors[task.owner]
                }}
                className="border"
              >
                {task.owner}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.start).toLocaleDateString()}</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.end).toLocaleDateString()}</span>
              </div>
              <span className="text-xs">({task.duration} days)</span>
            </div>
            
            {task.status !== 'upcoming' && task.status !== 'completed' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{task.taskProgress}%</span>
                </div>
                <Progress value={task.taskProgress} className="h-2" />
              </div>
            )}
          </div>
          
          {task.status === 'upcoming' && (
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-bold text-blue-600">{task.countdown}</div>
              <div className="text-xs text-muted-foreground uppercase">
                {task.countdown === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          )}
          
          {task.status === 'in-progress' && (
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-bold text-amber-600">{task.countdown}</div>
              <div className="text-xs text-muted-foreground uppercase">
                {task.countdown === 1 ? 'Day' : 'Days'} Left
              </div>
            </div>
          )}
          
          {task.status === 'overdue' && (
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-bold text-red-600">+{task.countdown}</div>
              <div className="text-xs text-muted-foreground uppercase">
                {task.countdown === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
              <PlayCircle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Overdue Tasks ({overdueTasks.length})
          </h2>
          <div className="space-y-3">
            {overdueTasks.map(renderTaskCard)}
          </div>
        </div>
      )}
      
      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-amber-500" />
            In Progress ({inProgressTasks.length})
          </h2>
          <div className="space-y-3">
            {inProgressTasks.map(renderTaskCard)}
          </div>
        </div>
      )}
      
      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Upcoming Tasks ({upcomingTasks.length})
          </h2>
          <div className="space-y-3">
            {upcomingTasks.map(renderTaskCard)}
          </div>
        </div>
      )}
      
      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.map(renderTaskCard)}
          </div>
        </div>
      )}
    </div>
  )
}
