import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirmPassword) return setError("As senhas não coincidem");
    setLoading(true);
    try { await api.auth.register({ email, password }); setShowOtp(true); }
    catch (err) { setError(err.message || "Falha no registro"); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError(""); setLoading(true);
    try { await api.auth.verifyOtp({ email, otpCode }); window.location.href = "/"; }
    catch (err) { setError(err.message || "Código de verificação inválido"); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError("");
    try { await api.auth.resendOtp(email); toast({ title: "Código enviado", description: "Verifique seu e-mail para o novo código." }); }
    catch (err) { setError(err.message || "Falha ao reenviar código"); }
  };

  const handleGoogle = () => api.auth.loginWithProvider("google", "/");

  if (showOtp) return <AuthLayout icon={Mail} title="Verifique seu e-mail" subtitle={`Enviamos um código para ${email}`}>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <div className="flex justify-center mb-6"><InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code"><InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup></InputOTP></div>
    <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar"}</Button>
    <p className="text-center text-sm text-muted-foreground mt-4">Não recebeu o código?{" "}<button onClick={handleResend} className="text-primary font-medium hover:underline">Reenviar</button></p>
  </AuthLayout>;

  return <AuthLayout icon={UserPlus} title="Crie sua conta" subtitle="Cadastre-se para começar" footer={<>Já tem uma conta?{" "}<Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link></>}>
    <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}><GoogleIcon className="w-5 h-5 mr-2" />Continuar com Google</Button>
    <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">ou</span></div></div>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">E-mail</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="pl-10 h-12" required /></div></div>
      <div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="pl-10 h-12" required /></div></div>
      <div className="space-y-2"><Label htmlFor="confirm">Confirmar Senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="confirm" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="pl-10 h-12" required /></div></div>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</> : "Criar conta"}</Button>
    </form>
  </AuthLayout>;
}
