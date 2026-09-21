import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  CheckCircle2,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { charitiesService } from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Charity } from '../../types';

export default function HomePage() {
  const [charities, setCharities] = useState<Charity[]>([]);

  useEffect(() => {
    charitiesService
      .getCharities()
      .then((data) => setCharities(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200/90 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2">
                <Badge variant="default" dot>
                  Verified Indian Philanthropic Gaming
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                Turn amateur golf rounds into guaranteed social impact.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Log your weekend Stableford scores (1–45). Your 5 latest scores form your monthly draw ticket.
                Match numbers to win cash prizes while directing a guaranteed portion of every membership
                to verified Indian non-profits.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/register">
                  <Button size="lg">
                    <span>Start Playing for Impact</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/charities">
                  <Button variant="secondary" size="lg">
                    Explore Charity Partners
                  </Button>
                </Link>
              </div>

              {/* Credibility highlights */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>10%–50% to chosen charity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Verified 80G non-profits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Automatic jackpot rollover</span>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Ticket Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Monthly Draw Ticket
                    </span>
                    <div className="text-sm font-semibold text-slate-200">
                      Standard 5-Round Window
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    Live Active Entry
                  </span>
                </div>

                {/* Score Balls */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Logged Stableford Points</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Valid 1–45</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {[
                      { score: 38, matched: true },
                      { score: 42, matched: true },
                      { score: 35, matched: true },
                      { score: 40, matched: true },
                      { score: 31, matched: false },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`h-14 rounded-xl flex flex-col items-center justify-center border transition-all ${
                          item.matched
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 font-semibold'
                        }`}
                      >
                        <span className="text-lg tabular-nums">{item.score}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-70">
                          {item.matched ? 'Match' : 'Round'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Summary Pill */}
                <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span className="text-slate-200 font-medium">4 of 5 Numbers Matched</span>
                  </div>
                  <span className="font-bold text-amber-400 tabular-nums">Tier 2 Payout Share</span>
                </div>

                {/* Philanthropy Allocation Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
                    <span>Beneficiary: The Akshaya Patra Foundation</span>
                  </div>
                  <span className="text-emerald-400 font-medium">15% Direct</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Numerical Impact Matrix */}
      <section className="bg-white border-b border-slate-200/90 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900 tabular-nums">8</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Partner Non-Profits
              </div>
              <p className="text-xs text-slate-400">Registered 80G Indian organizations</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold text-emerald-600 tabular-nums">40%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                5-Match Jackpot Share
              </div>
              <p className="text-xs text-slate-400">Automatic rollover if unclaimed</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900 tabular-nums">10% Min</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Guaranteed Charity Allocation
              </div>
              <p className="text-xs text-slate-400">Built into every membership</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold text-slate-900 tabular-nums">1–45</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Stableford Points Format
              </div>
              <p className="text-xs text-slate-400">Standardized amateur scoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Operates */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              System Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How Play for Impact Works
            </h3>
            <p className="text-slate-600 text-sm">
              A transparent, three-step cycle that turns every weekend round into measurable social support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <Card className="flex flex-col justify-between hover:border-slate-300">
              <CardContent className="p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-sm border border-emerald-200/80">
                    01
                  </div>
                  <Badge variant="neutral">Weekly Input</Badge>
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Log 5 Stableford Scores
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter your latest 18-hole Stableford points (1–45) with dates. The engine
                  automatically retains your 5 most recent scores as your monthly draw ticket.
                </p>
              </CardContent>
              <div className="px-7 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl text-xs text-slate-500 font-medium">
                Rolling 5-score window automatically maintained
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="flex flex-col justify-between hover:border-slate-300">
              <CardContent className="p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-sm border border-emerald-200/80">
                    02
                  </div>
                  <Badge variant="default">Give Back</Badge>
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Select Your Charity Partner
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Direct a minimum of 10% (or voluntarily increase it up to 50%) of your subscription
                  fee to your chosen Indian non-profit. Donations remit automatically.
                </p>
              </CardContent>
              <div className="px-7 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl text-xs text-slate-500 font-medium">
                Direct one-off donations also supported anytime
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="flex flex-col justify-between hover:border-slate-300">
              <CardContent className="p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-sm border border-emerald-200/80">
                    03
                  </div>
                  <Badge variant="warning">Monthly Draw</Badge>
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Match Numbers & Win
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  On the final day of the month, 5 winning numbers are generated. Match 3, 4, or 5 numbers
                  to share cash prize pools. Unclaimed 5-match jackpots roll over.
                </p>
              </CardContent>
              <div className="px-7 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl text-xs text-slate-500 font-medium">
                Prizes verified via official scorecard uploads
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Prize Allocation & Governance Strip */}
      <section className="bg-white border-y border-slate-200/90 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Governance & Integrity
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Audited Draw Pool Distribution
            </h3>
            <p className="text-slate-600 text-sm">
              All prize pools are calculated deterministically from subscriber pool contributions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier 1</span>
                <Badge variant="success">Rollover Enabled</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900">5 Matches · 40%</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                40% of net prize pool shared equally among 5-match ticket holders. Rolls forward if no player matches all 5 numbers.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier 2</span>
                <Badge variant="default">Cash Share</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900">4 Matches · 35%</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                35% of the prize pool divided among all players who match exactly 4 numbers.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier 3</span>
                <Badge variant="neutral">Cash Share</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900">3 Matches · 25%</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                25% of the prize pool distributed among all players matching 3 numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Spotlight Section */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Partner Non-Profits
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Verified Indian Charities
              </h3>
              <p className="text-slate-600 text-sm">
                Supporting education, child welfare, mid-day meals, and elderly care across India.
              </p>
            </div>
            <Link to="/charities">
              <Button variant="outline" size="sm">
                <span>View All Charities</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {charities.length > 0 ? (
              charities.map((charity) => (
                <Card key={charity.id} className="flex flex-col justify-between hover:border-slate-300">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200/80">
                        <Heart className="h-5 w-5 fill-emerald-600/20 text-emerald-700" />
                      </div>
                      {charity.website && (
                        <a
                          href={charity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                          title="Visit official website"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {charity.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                        {charity.description}
                      </p>
                    </div>
                  </CardContent>

                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Raised:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(charity.totalRaised || 0)}
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
                Loading charity directory...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Conversion Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="default" className="bg-emerald-950 text-emerald-300 border-emerald-800">
            Player Registration
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight">
            Turn your next 18 holes into sustainable impact.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Create an account, select your charity, and start logging scores today. Cancel or switch
            charities anytime.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                <span>Create Player Account</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg" className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
                View Player Leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
