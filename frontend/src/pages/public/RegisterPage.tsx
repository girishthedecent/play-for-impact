import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleDot, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.onboardingCompleted && user.role !== 'admin') {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setLoading(true);
      await registerUser(data.email, data.password, data.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-md w-full space-y-6">
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
            Create your account
          </h1>
          <p className="text-xs text-slate-500">
            Join Indian golfers turning amateur rounds into verified charitable donations.
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
                label="Full Name"
                placeholder="e.g. Anirban Lahiri"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="player@example.in"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button type="submit" loading={loading} className="w-full h-10 mt-2">
                <span>Continue to Charity Selection</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-700 hover:underline font-semibold">
                  Sign in instead
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits checklist */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 px-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Monthly cash prizes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Min 10% to charity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
