import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('should render main layout elements', () => {
    const { container } = render(<App />);
    
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
