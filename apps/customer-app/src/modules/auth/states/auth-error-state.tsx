interface AuthErrorStateProps {
  message: string;
}

export function AuthErrorState({ message }: AuthErrorStateProps) {
  return <p className="text-sm text-danger">{message}</p>;
}
