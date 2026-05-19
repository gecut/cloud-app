interface PlaceholderPageProps {
  title?: string;
}

export function PlaceholderPage({ title = "Hello World" }: PlaceholderPageProps) {
  return <div className="px-6 py-10">{title}</div>;
}
