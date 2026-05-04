import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ChunkErrorBoundary } from './ChunkErrorBoundary';

const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

describe('ChunkErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ChunkErrorBoundary>
        <div>Test content</div>
      </ChunkErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays error UI for chunk loading errors', () => {
    const chunkError = new Error('Loading chunk 123 failed');

    render(
      <ChunkErrorBoundary>
        <ThrowError error={chunkError} />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText('Unable to load page')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('reloads page on retry click', () => {
    const reloadMock = vi.fn();
    // Use vi.stubGlobal to mock window.location
    vi.stubGlobal('location', {
      ...window.location,
      reload: reloadMock,
    });

    const chunkError = new Error('Loading chunk failed');

    render(
      <ChunkErrorBoundary>
        <ThrowError error={chunkError} />
      </ChunkErrorBoundary>
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(reloadMock).toHaveBeenCalled();

    // Clean up the stub
    vi.unstubAllGlobals();
  });

  it('renders custom fallback when provided', () => {
    const chunkError = new Error('Loading chunk failed');

    render(
      <ChunkErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowError error={chunkError} />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('does not catch non-chunk errors', () => {
    const normalError = new Error('Some other error');

    // This should throw because it's not a chunk error
    expect(() => {
      render(
        <ChunkErrorBoundary>
          <ThrowError error={normalError} />
        </ChunkErrorBoundary>
      );
    }).toThrow('Some other error');
  });
});
