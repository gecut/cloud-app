interface ErrorStateBlockProps {
  message: string;
}

export function ErrorStateBlock({ message }: ErrorStateBlockProps) {
  return <div className="px-6 py-10 text-center text-sm text-danger">{message}</div>;
}
