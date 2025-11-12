import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface Task {
  id: string
  label: string
  start: string
  end: string
  owner: string
}

interface DashboardViewProps {
  tasks: Task[]
  progress: Record<string, number>
  currentDate: string
}

const toDate = (s: string) => new Date(s)

export function DashboardView({ tasks, progress, currentDate }: DashboardViewProps) {
  const stats = useMemo(() => {
    const today = toDate(currentDate)
    let notStarted = 0
    let inProgress = 0
    let completed = 0
    let overdue = 0

    tasks.forEach(task => {
      const taskProgress = progress[task.id] || 0
      const start = toDate(task.start)
      const end = toDate(task.end)

      if (taskProgress === 100) {
        completed++
      } else if (today < start) {
        notStarted++
      } else if (today >= start && today <= end) {
        inProgress++
      } else if (today > end && taskProgress < 100) {
        overdue++
      }
    })

    return { notStarted, inProgress, completed, overdue, total: tasks.length }
  }, [tasks, progress, currentDate])

  // Status colors (matching GanttView and App.tsx)
  const statusColors = {
    completed: '#10b981',    // Green (emerald-500)
    'in-progress': '#3b82f6', // Blue (blue-500)
    'not-started': '#6b7280', // Gray (gray-500)
    overdue: '#ef4444',      // Red (red-500)
  }

  const pieData = [
    { name: 'Completed', value: stats.completed, color: statusColors.completed },
    { name: 'In Progress', value: stats.inProgress, color: statusColors['in-progress'] },
    { name: 'Not Started', value: stats.notStarted, color: statusColors['not-started'] },
    { name: 'Overdue', value: stats.overdue, color: statusColors.overdue },
  ].filter(d => d.value > 0)

  const ownerStats = useMemo(() => {
    const byOwner: Record<string, { total: number; avgProgress: number; tasks: number }> = {}
    
    tasks.forEach(task => {
      const owner = task.owner
      if (!byOwner[owner]) {
        byOwner[owner] = { total: 0, avgProgress: 0, tasks: 0 }
      }
      byOwner[owner].tasks++
      byOwner[owner].total += (progress[task.id] || 0)
    })

    return Object.entries(byOwner).map(([owner, data]) => ({
      owner,
      avgProgress: Math.round(data.total / data.tasks),
      tasks: data.tasks
    })).sort((a, b) => b.avgProgress - a.avgProgress)
  }, [tasks, progress])

  const overallProgress = useMemo(() => {
    const total = tasks.reduce((sum, task) => sum + (progress[task.id] || 0), 0)
    return Math.round(total / tasks.length)
  }, [tasks, progress])

  const upcomingMilestones = useMemo(() => {
    const today = toDate(currentDate)
    return tasks
      .filter(t => {
        const end = toDate(t.end)
        const daysUntil = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil >= 0 && daysUntil <= 30 && (progress[t.id] || 0) < 100
      })
      .sort((a, b) => toDate(a.end).getTime() - toDate(b.end).getTime())
      .slice(0, 5)
  }, [tasks, progress, currentDate])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-white/90">Overall Progress</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-2">{overallProgress}%</div>
            <Progress value={overallProgress} className="h-2 bg-white/20" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-white/90">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.completed}</div>
            <p className="text-xs text-white/80">of {stats.total} tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-white/90">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.inProgress}</div>
            <p className="text-xs text-white/80">active tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-white/90">Not Started</CardTitle>
            <Calendar className="h-5 w-5 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.notStarted}</div>
            <p className="text-xs text-white/80">upcoming</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-white/90">Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.overdue}</div>
            <p className="text-xs text-white/80">need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress by Owner */}
        <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Progress by Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ownerStats} layout="vertical">
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="owner" width={130} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Bar dataKey="avgProgress" fill="url(#colorGradient)" radius={[0, 6, 6, 0]} barSize={20} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Milestones */}
      <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Upcoming Milestones (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming milestones in the next 30 days</p>
            ) : (
              upcomingMilestones.map(task => {
                const daysUntil = Math.round((toDate(task.end).getTime() - toDate(currentDate).getTime()) / (1000 * 60 * 60 * 24))
                const taskProgress = progress[task.id] || 0
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{task.label}</span>
                        <Badge 
                          variant={daysUntil <= 7 ? 'destructive' : 'secondary'}
                          className={daysUntil <= 7 ? 'bg-gradient-to-r from-red-500 to-pink-500 border-0 shadow-sm' : ''}
                        >
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={taskProgress} className="h-2.5 flex-1" />
                        <span className="text-xs">{taskProgress}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {toDate(task.end).toLocaleDateString()} • {task.owner}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
