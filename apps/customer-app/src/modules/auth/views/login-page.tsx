import { Card } from "@heroui/react";

export function LoginPage() {
  return (
    <main className="flex-1 size-full flex p-6 items-center justify-center">
      <Card className="w-full max-w-md p-6" variant="secondary">
        <Card.Header>
          <Card.Title className="text-xl">سناریوی احراز هویت غیرفعال است</Card.Title>
          <Card.Description className="text-sm mt-2">
            در این برنچ تمرکز فقط روی توسعه صفحات است و جریان auth موقتا حذف شده است.
          </Card.Description>
        </Card.Header>
      </Card>
    </main>
  );
}
