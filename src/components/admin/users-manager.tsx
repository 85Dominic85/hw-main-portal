"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, KeyRound, Trash2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { createUser, updateUser, resetUserPassword, removeUser } from "@/server/actions/users";

export interface AccountRow {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "viewer";
  active: boolean;
}

export function UsersManager({ accounts, currentEmail }: { accounts: AccountRow[]; currentEmail: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Crear
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("admin");

  // Reset password inline (por fila)
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Error");
        return;
      }
      toast.success(okMsg);
      after?.();
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    run(
      () => createUser({ email, name: name || undefined, password, role }),
      "Usuario creado.",
      () => {
        setEmail("");
        setName("");
        setPassword("");
        setRole("admin");
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Crear usuario */}
      <form onSubmit={handleCreate} className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="nu-email" className="text-xs">Email</Label>
          <Input id="nu-email" type="email" required placeholder="persona@qamarero.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nu-name" className="text-xs">Nombre</Label>
          <Input id="nu-name" type="text" placeholder="Opcional" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nu-pwd" className="text-xs">Contraseña</Label>
          <Input id="nu-pwd" type="text" required placeholder="mín. 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nu-role" className="text-xs">Rol</Label>
          <select id="nu-role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "viewer")} disabled={isPending} className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" />
            Crear
          </Button>
        </div>
      </form>

      {/* Lista */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No hay cuentas creadas. Mientras tanto, los 3 emails del departamento entran con la
                  contraseña compartida. Crea cuentas arriba para gestión individual.
                </td>
              </tr>
            )}
            {accounts.map((acc) => {
              const isSelf = acc.email === currentEmail;
              return (
                <tr key={acc.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2 font-medium">
                    {acc.email}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{acc.name || "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      value={acc.role}
                      disabled={isPending}
                      onChange={(e) =>
                        run(() => updateUser({ id: acc.id, role: e.target.value }), "Rol actualizado.")
                      }
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => updateUser({ id: acc.id, active: !acc.active }), acc.active ? "Cuenta desactivada." : "Cuenta activada.")}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        acc.active ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {acc.active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {acc.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {resetFor === acc.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            autoFocus
                            placeholder="nueva contraseña"
                            value={resetPwd}
                            onChange={(e) => setResetPwd(e.target.value)}
                            className="h-8 w-40"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending || resetPwd.length < 8}
                            onClick={() =>
                              run(() => resetUserPassword({ id: acc.id, password: resetPwd }), "Contraseña cambiada.", () => {
                                setResetFor(null);
                                setResetPwd("");
                              })
                            }
                          >
                            Guardar
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => { setResetFor(null); setResetPwd(""); }}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { setResetFor(acc.id); setResetPwd(""); }}>
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                            Contraseña
                          </Button>
                          {!isSelf && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                              disabled={isPending}
                              title="Eliminar cuenta"
                              onClick={() => {
                                if (confirm(`¿Eliminar la cuenta ${acc.email}?`)) {
                                  run(() => removeUser({ id: acc.id }), "Cuenta eliminada.");
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
