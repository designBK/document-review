import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="w-full">
      <Separator />
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Badge variant="secondary">© 2026 Document Review</Badge>
        <nav className="flex items-center gap-1">
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={<Link href="/privacy" />}
          >
            Privacy
          </Button>
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={<Link href="/terms" />}
          >
            Terms
          </Button>
        </nav>
      </div>
    </footer>
  );
}
