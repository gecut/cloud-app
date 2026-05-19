interface EmptyStateBlockProps {
  message: string;
}

export function EmptyStateBlock({ message }: EmptyStateBlockProps) {
  return <div className="px-6 py-10 text-center text-sm text-foreground-500">{message}</div>;
}
