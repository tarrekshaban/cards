interface YearPickerProps {
  value: number
  onChange: (year: number) => void
  minYear?: number
  maxYear?: number
}

export default function YearPicker({
  value,
  onChange,
  minYear = 2020,
  maxYear = new Date().getFullYear(),
}: YearPickerProps) {
  const years = []
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y)
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="input w-auto"
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  )
}
