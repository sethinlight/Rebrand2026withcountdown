import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { categoryLabels } from "../App"

interface ColorSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryColors: Record<string, string>
  onUpdateColor: (category: string, color: string) => void
  onResetColors: () => void
}

export function ColorSettingsDialog({
  open,
  onOpenChange,
  categoryColors,
  onUpdateColor,
  onResetColors,
}: ColorSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Category Color Settings</DialogTitle>
          <DialogDescription>
            Customize the colors for each category indicator on the Gantt chart.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {Object.keys(categoryColors).map((category) => (
            <div key={category} className="flex items-center justify-between gap-4">
              <Label htmlFor={`color-${category}`} className="flex items-center gap-2 min-w-[140px]">
                <div
                  className="w-6 h-6 rounded border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: categoryColors[category] }}
                />
                {categoryLabels[category]}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id={`color-${category}`}
                  type="color"
                  value={categoryColors[category]}
                  onChange={(e) => onUpdateColor(category, e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono w-20">
                  {categoryColors[category].toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetColors}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
