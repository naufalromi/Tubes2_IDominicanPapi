import Card from '../../../components/ui/Card'

type StatCardProps = {
  label: string
  value: string | number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card padding="14px">
      <div
        style={{
          fontSize: '13px',
          color: '#aaa',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'white',
        }}
      >
        {value}
      </div>
    </Card>
  )
}

export default StatCard