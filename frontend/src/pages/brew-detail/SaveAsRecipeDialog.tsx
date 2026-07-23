import { useState } from 'react'
import { toast } from 'sonner'
import { useSaveAsRecipe } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BookmarkPlus } from 'lucide-react'

export function SaveAsRecipeDialog({ brewId, brewName }: { brewId: number; brewName: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(brewName)
  const saveAsRecipe = useSaveAsRecipe(brewId)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Recipe name is required.')
      return
    }
    await saveAsRecipe.mutateAsync(name)
    toast.success(`Saved recipe "${name}".`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookmarkPlus className="size-4" />
          Save as recipe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as recipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Recipe name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saveAsRecipe.isPending}>
            {saveAsRecipe.isPending ? 'Saving…' : 'Save recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
