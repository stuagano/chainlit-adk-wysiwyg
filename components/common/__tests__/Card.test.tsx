import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders provided children', () => {
    render(<Card>Sample Content</Card>);

    expect(screen.getByText('Sample Content')).toBeTruthy();
  });

  it('merges custom class names', () => {
    render(
      <Card className="custom-border">
        <span>With Style</span>
      </Card>
    );

    expect(screen.getByText('With Style').parentElement?.className).toContain('custom-border');
  });
});
