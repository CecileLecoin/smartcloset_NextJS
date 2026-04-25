type AcceptCGUProps = {
  accepted: boolean
  onChange: (value: boolean) => void
}

export default function AcceptCGU({ accepted, onChange }: AcceptCGUProps) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1"
        />
        <span>
          J’ai lu et j’accepte les{' '}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/cgu`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Conditions Générales d’Utilisation
          </a>
        </span>
      </label>
    </div>
  )
}