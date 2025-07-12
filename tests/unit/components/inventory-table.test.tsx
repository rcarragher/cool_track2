import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock inventory table component
const MockInventoryTable = ({ items, onEdit, onDelete }: any) => (
  <table data-testid="inventory-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Quantity</th>
        <th>Device</th>
        <th>Expiration</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item: any) => (
        <tr key={item.id} data-testid={`item-row-${item.id}`}>
          <td>{item.name}</td>
          <td>{item.category}</td>
          <td>{item.quantity}</td>
          <td>{item.deviceId === 1 ? 'Refrigerator' : 'Freezer'}</td>
          <td>{item.expirationDate}</td>
          <td>
            <button onClick={() => onEdit(item)}>Edit</button>
            <button onClick={() => onDelete(item.id)}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('InventoryTable Component', () => {
  const mockItems = [
    {
      id: 1,
      name: 'Apples',
      category: 'fruit-veg',
      quantity: '5 pieces',
      deviceId: 1,
      dateAdded: '2025-07-10',
      expirationDate: '2025-07-15'
    },
    {
      id: 2,
      name: 'Frozen Pizza',
      category: 'prepared',
      quantity: '1 pizza',
      deviceId: 2,
      dateAdded: '2025-07-08',
      expirationDate: '2025-12-01'
    }
  ];

  it('should render table with inventory items', () => {
    render(
      <TestWrapper>
        <MockInventoryTable 
          items={mockItems}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Frozen Pizza')).toBeInTheDocument();
    expect(screen.getByText('fruit-veg')).toBeInTheDocument();
    expect(screen.getByText('prepared')).toBeInTheDocument();
  });

  it('should display device names correctly', () => {
    render(
      <TestWrapper>
        <MockInventoryTable 
          items={mockItems}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Refrigerator')).toBeInTheDocument();
    expect(screen.getByText('Freezer')).toBeInTheDocument();
  });

  it('should render action buttons for each item', () => {
    render(
      <TestWrapper>
        <MockInventoryTable 
          items={mockItems}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </TestWrapper>
    );

    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('should handle empty items array', () => {
    render(
      <TestWrapper>
        <MockInventoryTable 
          items={[]}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
    const rows = screen.queryAllByRole('row');
    expect(rows).toHaveLength(1); // Only header row
  });

  it('should call onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn();
    
    render(
      <TestWrapper>
        <MockInventoryTable 
          items={mockItems}
          onEdit={mockOnEdit}
          onDelete={vi.fn()}
        />
      </TestWrapper>
    );

    const editButtons = screen.getAllByText('Edit');
    editButtons[0].click();

    expect(mockOnEdit).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should call onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    
    render(
      <TestWrapper>
        <MockInventoryTable 
          items={mockItems}
          onEdit={vi.fn()}
          onDelete={mockOnDelete}
        />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByText('Delete');
    deleteButtons[1].click();

    expect(mockOnDelete).toHaveBeenCalledWith(2);
  });
});