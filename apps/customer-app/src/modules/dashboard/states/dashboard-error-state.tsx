interface DashboardErrorStateProps {
  message?: string;
}

export function DashboardErrorState({ message }: DashboardErrorStateProps) {
  return (
    <div className="w-full h-full min-h-0 px-6 py-10 flex items-center justify-center text-center text-sm text-danger">
      {message ?? "در دریافت اطلاعات داشبورد خطایی رخ داد."}
    </div>
  );
}
