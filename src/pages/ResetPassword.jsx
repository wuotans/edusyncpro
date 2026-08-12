import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams(); const resetToken = searchParams.get("token");
  const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); setError(""); if (newPassword !== confirmPassword) return setError("As senhas não coincidem"); setLoading(true); try { await api.auth.resetPassword({ resetToken, newPassword }); window.location.href = "/login"; } catch (err) { setError(err.message || "Falha ao redefinir senha"); } finally { setLoading(false); } };
  if (!resetToken) return <AuthLayout icon={AlertTriangle} title="Link inválido" subtitle="Este link de redefinição está ausente ou inválido" footer={<Link to="/forgot-password" className="text-primary font-medium hover:underline">Solicitar novo link</Link>}><p className="text-sm text-foreground text-center">O link que você usou parece estar incompleto.</p></AuthLayout>;
  return <AuthLayout icon={Lock} title="Nova senha" subtitle="Digite sua nova senha abaixo">{error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="password">Nova Senha</Label><Input id="password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="confirm">Confirmar Senha</Label><Input id="confirm" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required /></div><Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redefinindo...</> : "Redefinir senha"}</Button></form></AuthLayout>;
}
