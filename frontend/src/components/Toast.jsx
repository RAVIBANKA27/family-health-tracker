export default function Toast({ message, type, onClose }) {
  const bg = type === 'error' ? 'var(--warn)' : type === 'success' ? 'var(--good)' : '#1c1917'
  return (
    <div className="toast" style={{ background: bg }} onClick={onClose}>
      {message}
    </div>
  )
}
