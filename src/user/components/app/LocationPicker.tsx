import { MapPin } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import type { PrintLocation } from '@/types'

/** Print-location select (home_screen.dart _pickLocation), bound externally. */
export function LocationPicker({
  locations,
  selectedId,
  onChange,
  onDark = false,
}: {
  locations: PrintLocation[]
  selectedId: string | null
  onChange: (id: string) => void
  onDark?: boolean
}) {
  return (
    <Select
      label="Print Location"
      placeholder={locations.length ? 'Choose a print location' : 'No print locations available yet'}
      value={selectedId}
      onChange={onChange}
      onDark={onDark}
      options={locations.map((l) => ({ value: l.id, label: l.name, icon: MapPin }))}
    />
  )
}
