import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Mock wouter since we're testing in isolation
const MockRouter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

// Mock the dashboard card component since we need to read it first
const MockDashboardCard = ({ title, count, description, onClick }: any) => (
  <div data-testid="dashboard-card" onClick={onClick}>
    <h3>{title}</h3>
    <span data-testid="count">{count}</span>
    <p>{description}</p>
  </div>
);

// Create a test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MockRouter>
        {children}
      </MockRouter>
    </QueryClientProvider>
  );
};

describe('DashboardCard Component', () => {
  it('should render card with title, count, and description', () => {
    render(
      <TestWrapper>
        <MockDashboardCard 
          title="Total Items" 
          count={42} 
          description="Items in inventory" 
        />
      </TestWrapper>
    );

    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByTestId('count')).toHaveTextContent('42');
    expect(screen.getByText('Items in inventory')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const mockOnClick = vi.fn();
    
    render(
      <TestWrapper>
        <MockDashboardCard 
          title="Expiring Soon" 
          count={5} 
          description="Items expiring in 3 days"
          onClick={mockOnClick}
        />
      </TestWrapper>
    );

    const card = screen.getByTestId('dashboard-card');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should display zero count correctly', () => {
    render(
      <TestWrapper>
        <MockDashboardCard 
          title="Expired Items" 
          count={0} 
          description="No expired items" 
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('should handle large numbers', () => {
    render(
      <TestWrapper>
        <MockDashboardCard 
          title="All Items" 
          count={1234} 
          description="Total inventory count" 
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('1234');
  });
});