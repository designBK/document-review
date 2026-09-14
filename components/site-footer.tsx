import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="w-full">
      <Separator />
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Badge variant="secondary">© 2026 Document Review</Badge>
        <nav className="flex items-center gap-1">
          <a
            href="/privacy"
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            Privacy
          </a>
          <a
            href="/terms"
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
