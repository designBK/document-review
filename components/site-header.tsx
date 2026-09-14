"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <header className="w-full">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Badge>Document Review</Badge>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">Jane Doe</span>
              <span className="text-xs text-muted-foreground">Reviewer</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLoggedIn((loggedIn) => !loggedIn)}
          >
            {isLoggedIn ? "Log out" : "Log in"}
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  );
}
