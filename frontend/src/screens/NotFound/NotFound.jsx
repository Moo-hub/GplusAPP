import useSafeTranslation from '../../hooks/useSafeTranslation';
import './NotFound.css';

export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="not-found">
      <Card title={t('notFound.title')} variant="dark">
        <div className="not-found-content">
          <div className="not-found-emoji">404</div>
          <p>{t('notFound.message')}</p>
          <Link to="/">
            <Button variant="primary">{t('notFound.goHome')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}