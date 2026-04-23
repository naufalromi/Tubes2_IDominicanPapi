import type { InputSource } from '../types'
import Tabs from '../../../components/ui/Tabs'

type InputSourceTabsProps = {
  value: InputSource
  onChange: (value: InputSource) => void
}

function InputSourceTabs({ value, onChange }: InputSourceTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(nextValue) => onChange(nextValue as InputSource)}
      options={[
        { label: 'URL', value: 'url' },
        { label: 'HTML', value: 'html' },
      ]}
    />
  )
}

export default InputSourceTabs
