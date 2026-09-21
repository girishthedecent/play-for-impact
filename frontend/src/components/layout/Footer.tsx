import { CircleDot, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-emerald-50 flex items-center justify-center border border-emerald-200/80">
                <CircleDot className="h-3.5 w-3.5 text-emerald-700" />
              </div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                Play for Impact
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              An independent Indian platform transforming weekend golf rounds into reliable funding for national causes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
            <Link to="/" className="hover:text-slate-900 transition-colors">Overview</Link>
            <Link to="/charities" className="hover:text-slate-900 transition-colors">Charities</Link>
            <Link to="/leaderboard" className="hover:text-slate-900 transition-colors">Leaderboard</Link>
            <a href="mailto:support@playforimpact.in" className="hover:text-slate-900 transition-colors">
              support@playforimpact.in
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Play for Impact India. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by sport with purpose</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500 ml-1 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
