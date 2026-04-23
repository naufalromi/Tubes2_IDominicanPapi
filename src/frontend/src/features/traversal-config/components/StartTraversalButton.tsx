import Button from '../../../components/ui/Button'

type StartTraversalButtonProps = {
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
}

function StartTraversalButton({
  onClick,
  disabled = false,
  isLoading = false,
}: StartTraversalButtonProps) {
  return (
    <Button onClick={onClick} fullWidth disabled={disabled}>
      {isLoading ? 'Running Traversal...' : 'Start Traversal'}
    </Button>
  )
}

export default StartTraversalButton
