import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/supports/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='w-full flex flex-col items-center justify-center h-[50dvh] animate-caret-blink text-3xl gap-10'>
    <span>پاسخگویی 24 ساعته</span>
    <span>تماس بگیر با این</span>
    <span>09155595488</span>
  </div>
}
