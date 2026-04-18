import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { projectId } from '/utils/supabase/info';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm56bmF6Ym9pbWJ6bHBjbmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQyNzMsImV4cCI6MjA5MjA3MDI3M30.6WN4uQXBXpHRGL8gJr4OyBYgxAEzG5sbW-1Q7JRLeRM';
        
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/smooth-handler/auth/signup`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`
          },
          body: JSON.stringify(formData),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-zinc-200">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Package className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isLogin ? "Đăng nhập Inventro" : "Tạo tài khoản mới"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Nhập email và mật khẩu của bạn để truy cập."
              : "Điền thông tin bên dưới để đăng ký tài khoản."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </Button>
            
            <div className="text-center text-sm text-zinc-500 mt-4">
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                type="button"
                className="font-medium text-zinc-900 underline hover:text-zinc-700"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Đăng ký" : "Đăng nhập"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}