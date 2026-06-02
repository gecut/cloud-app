export function Progress({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-blue-500/20 rounded-full">
      <div
        className="h-full bg-accent rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
