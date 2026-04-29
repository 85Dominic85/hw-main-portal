import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-mono text-xl tracking-tight">
          Qamarero / HW
        </CardTitle>
        <CardDescription>HW Main Portal</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-md bg-muted/30" />
          }
        >
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
