import { useState, useEffect, useMemo } from 'react';
import { Search, Heart, ExternalLink, Globe2, ShieldCheck } from 'lucide-react';
import { charitiesService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Charity } from '../../types';

const CATEGORIES = [
  'All Causes',
  'Child Welfare',
  'Education',
  'Food & Meals',
  'Healthcare',
  'Rural Relief',
];

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Causes');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    charitiesService
      .getCharities()
      .then((data) => {
        if (!cancelled) {
          setCharities(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load charities');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = charities;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All Causes') {
      const tag = selectedCategory.toLowerCase().split(' ')[0];
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(tag) ||
          c.description.toLowerCase().includes(tag)
      );
    }
    return result;
  }, [search, selectedCategory, charities]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18 space-y-6">
          <div className="max-w-2xl space-y-3">
            <Badge variant="default" dot>
              80G & 12A Certified Indian Non-Profits
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Partner Charities
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every Play for Impact member directs a guaranteed portion (10% to 50%) of their subscription directly to one
              of our verified Indian charitable foundations and non-profits.
            </p>
          </div>

          {/* Search and Category Filters */}
          <div className="space-y-4 pt-2">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by charity name or cause..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 transition-all shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {filtered.length} of {charities.length} registered charities</span>
            {(search || selectedCategory !== 'All Causes') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All Causes');
                }}
                className="text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-xl space-y-3">
              <Heart className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No charities match your search</div>
              <p className="text-xs text-slate-400">Try searching for keywords like education, meals, children, or health.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((charity) => (
                <Card
                  key={charity.id}
                  className="flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-200/80">
                        <Heart className="h-6 w-6 text-emerald-700 fill-emerald-600/15" />
                      </div>
                      {charity.website && (
                        <a
                          href={charity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 transition-colors"
                        >
                          <Globe2 className="h-3 w-3" />
                          <span>Official Site</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {charity.name}
                        </h3>
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {charity.description}
                      </p>
                    </div>
                  </CardContent>

                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        Total Raised
                      </div>
                      <div className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatCurrency(charity.totalRaised || 0)}
                      </div>
                    </div>
                    <Badge variant="success" dot>80G Verified</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
