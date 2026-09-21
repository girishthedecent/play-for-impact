import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-text mb-4">404</h1>
        <p className="text-xl text-text-muted mb-8">Page not found</p>
        <Link to="/">
          <Button>
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
