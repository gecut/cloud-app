import { ModeToggle } from "@/app/components/mode-toggle";
import { Avatar } from "@heroui/react";

interface UserProps {
  profileImage: string;
  profileName?: string;
}

export function Header({
  profileImage = "/hello.png",
  profileName = "ehsan",
}: {
  profileImage?: string;
  profileName?: string;
}) {
  console.log(profileImage, profileName);
  return (
    <header className="fixed top-0 inset-x-0 border-b border-b-border bg-surface supports-[backdrop-filter]:backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80 h-16 z-50">
      <nav className="w-full max-w-md mx-auto flex items-center justify-between px-6">
        <ModeToggle />
        <Avatar>
          <Avatar.Image alt="John Doe" src={profileImage} />
          <Avatar.Fallback className="flex items-center justify-center">
            {profileName?.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
      </nav>
    </header>
  );
}
