import PropTypes from 'prop-types';
import styled from 'styled-components';
import Skeleton from './Skeleton';

const CardWrapper = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--card-bg, #fff);
  
  [data-theme='dark'] & {
    background-color: var(--card-dark-bg, #2a2a2a);
  }
`;

const CardContent = styled.div`
  padding: 1rem;
`;

/**
 * Skeleton loader for a card component
 */
export const CardSkeleton = ({ imageHeight, rows = 3, hasHeader = true }) => (
  <CardWrapper>
    <SkeletonRect height={imageHeight || '180px'} margin="0" />
    
    <CardContent>
      {hasHeader && (
        <>
          <SkeletonText height="1.5rem" width="60%" margin="0.5rem 0 1rem" />
          <SkeletonText height="0.875rem" width="40%" margin="0 0 1.5rem" />
        </>
      )}
      
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonText 
          key={index} 
          height="1rem" 
          width={`${Math.floor(Math.random() * 30) + 70}%`} 
          margin="0.75rem 0"
        />
      ))}
      
      <SkeletonText height="2rem" width="30%" margin="1.5rem 0 0.5rem" />
    </CardContent>
  </CardWrapper>
);

CardSkeleton.propTypes = {
  imageHeight: PropTypes.string,
  rows: PropTypes.number,
  hasHeader: PropTypes.bool,
};

const TableWrapper = styled.div`
  width: 100%;
`;

const TableRow = styled.div`
  display: flex;
  margin: 0.5rem 0;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color, #eaeaea);
  
  [data-theme='dark'] & {
    border-bottom: 1px solid var(--border-dark-color, #444);
  }
`;

const TableCell = styled.div`
  flex: ${({ width }) => width || 1};
  padding: 0 0.5rem;
`;

/**
 * Skeleton loader for a table component
 */
export const TableSkeleton = ({ rows = 5, columns = 4, headerHeight = '2rem' }) => (
  <TableWrapper>
    {/* Table header */}
    <TableRow>
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index} width={index === 0 ? 2 : 1}>
          <SkeletonText height={headerHeight} margin="0" />
        </TableCell>
      ))}
    </TableRow>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <TableCell key={colIndex} width={colIndex === 0 ? 2 : 1}>
            <SkeletonText 
              height="1.25rem"
              width={`${Math.floor(Math.random() * 30) + 60}%`}
              margin="0"
            />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableWrapper>
);

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  headerHeight: PropTypes.string,
};

const ListWrapper = styled.div`
  width: 100%;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color, #eaeaea);
  
  [data-theme='dark'] & {
    border-bottom: 1px solid var(--border-dark-color, #444);
  }
`;

const ListContent = styled.div`
  flex: 1;
  margin-left: ${({ hasAvatar }) => hasAvatar ? '1rem' : '0'};
`;

/**
 * Skeleton loader for a list component
 */
export const ListSkeleton = ({ items = 5, hasAvatar = true, twoLines = true }) => (
  <ListWrapper>
    {Array.from({ length: items }).map((_, index) => (
      <ListItem key={index}>
        {hasAvatar && <SkeletonCircle size="2.5rem" />}
        <ListContent hasAvatar={hasAvatar}>
          <SkeletonText height="1.25rem" width="70%" margin="0" />
          {twoLines && (
            <SkeletonText height="0.875rem" width="50%" margin="0.5rem 0 0" />
          )}
        </ListContent>
      </ListItem>
    ))}
  </ListWrapper>
);

ListSkeleton.propTypes = {
  items: PropTypes.number,
  hasAvatar: PropTypes.bool,
  twoLines: PropTypes.bool,
};

const ProfileWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  text-align: center;
`;

/**
 * Skeleton loader for a user profile component
 */
export const ProfileSkeleton = () => (
  <ProfileWrapper>
    <SkeletonCircle size="6rem" />
    <SkeletonText height="1.5rem" width="50%" margin="1.5rem 0 0.5rem" />
    <SkeletonText height="1rem" width="70%" margin="0.5rem 0" />
    <SkeletonText height="1rem" width="40%" margin="0.5rem 0 1.5rem" />
    
    {/* Profile details */}
    <div style={{ width: '100%', marginTop: '1rem' }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} style={{ display: 'flex', margin: '1rem 0' }}>
          <SkeletonText height="1rem" width="30%" margin="0" />
          <SkeletonText height="1rem" width="50%" margin="0 0 0 auto" />
        </div>
      ))}
    </div>
  </ProfileWrapper>
);

/**
 * Skeleton loader for form inputs
 */
export const FormSkeleton = ({ fields = 4, hasLabels = true }) => (
  <div style={{ width: '100%' }}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} style={{ margin: '1.5rem 0' }}>
        {hasLabels && (
          <SkeletonText height="1rem" width="30%" margin="0 0 0.5rem" />
        )}
        <SkeletonRect height="2.5rem" width="100%" margin="0" />
      </div>
    ))}
    <SkeletonRect height="2.5rem" width="30%" margin="2rem 0 1rem" />
  </div>
);

FormSkeleton.propTypes = {
  fields: PropTypes.number,
  hasLabels: PropTypes.bool,
};

export default {
  Base: Skeleton,
  Card: CardSkeleton,
  Table: TableSkeleton,
  List: ListSkeleton,
  Profile: ProfileSkeleton,
  Form: FormSkeleton,
};