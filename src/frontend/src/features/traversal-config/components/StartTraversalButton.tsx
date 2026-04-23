import Button from '../../../components/ui/Button'

type StartTraversalButtonProps = {
  onClick?: () => void
}

function StartTraversalButton({ onClick }: StartTraversalButtonProps) {
  return (
    <Button onClick={onClick} fullWidth>
      Start Traversal
    </Button>
  )
}

export default StartTraversalButton