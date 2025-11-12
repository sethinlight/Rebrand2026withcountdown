import { Search, X } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'

interface FilterPanelProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  ownerFilter: string
  setOwnerFilter: (owner: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  owners: string[]
  onReset: () => void
}

export function FilterPanel({
  searchTerm,
  setSearchTerm,
  ownerFilter,
  setOwnerFilter,
  statusFilter,
  setStatusFilter,
  owners,
  onReset
}: FilterPanelProps) {
  const hasActiveFilters = searchTerm || ownerFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      <Select value={ownerFilter} onValueChange={setOwnerFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Owners</SelectItem>
          {owners.map(owner => (
            <SelectItem key={owner} value={owner}>{owner}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="not-started">Not Started</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}

      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary">
              Search: {searchTerm}
            </Badge>
          )}
          {ownerFilter !== 'all' && (
            <Badge variant="secondary">
              Owner: {ownerFilter}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary">
              Status: {statusFilter.replace('-', ' ')}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
