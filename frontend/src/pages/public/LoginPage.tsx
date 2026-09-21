import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleDot, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setLoading(true);
      await login(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = () => {
    setValue('email', 'admin@golfdraw.com');
    setValue('password', 'admin123');
  };

  if (user) return null;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/80 shadow-2xs">
              <CircleDot className="h-5 w-5 text-emerald-700" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Play for Impact
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-xs text-slate-500">
            Access your handicap cards, draws, and charitable impact.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-7 space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="underline text-xs font-semibold ml-2">
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="player@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" loading={loading} className="w-full h-10 mt-2">
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <Link to="/register" className="text-emerald-700 hover:underline font-semibold">
                  Register free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Helper Card */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2 text-xs shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Evaluation Test Credentials</span>
            </div>
            <button
              onClick={handleDemoAdmin}
              className="text-emerald-700 hover:underline font-semibold text-[11px] cursor-pointer"
              type="button"
            >
              Fill Admin
            </button>
          </div>
          <div className="text-slate-500 text-[11px] font-mono bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5">
            <div>Email: admin@golfdraw.com</div>
            <div>Password: admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
