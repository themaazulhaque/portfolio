import { getReviews } from '@/app/actions/reviews';
import { ReviewsTable } from './reviews-table';

export const metadata = { title: 'Reviews — Admin' };

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reviews</h1>
        <p className="page-subtitle">Manage client review submissions</p>
      </div>
      <ReviewsTable initialReviews={reviews} />
    </div>
  );
}
